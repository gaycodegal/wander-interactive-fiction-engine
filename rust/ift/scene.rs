use sentence::NounClause;
use sentence::Sentence;
use serde_json::Value;
use std::collections::HashMap;

pub struct Scene {
    root: Value,
}

impl Scene {
    pub fn new(root: Value) -> Scene {
        Scene { root: root }
    }

    pub fn ask_question(&mut self, sentence: &Sentence) -> bool {
        let result = self.ask_question_helper(sentence);
        match result {
            Some(result) => result,
            None => false,
        }
    }

    fn ask_question_helper(&mut self, sentence: &Sentence) -> Option<bool> {
        let qtype = &sentence.q_type.to_owned()?;

        let unfiltered = vec![];

        let mut location = match &sentence.prep {
            Some(prep) => Some(self.select(&prep.noun_clause, &unfiltered)),
            None => None,
        };
        if location.is_none() && sentence.prep.is_some() {
            return Some(false);
        }
        let mut location: &mut Value = match &mut location {
            Some(matches) => {
                if matches.len() == 0 {
                    None
                } else {
                    Some(&mut matches[0])
                }
            }
            None => None,
        }
        .unwrap_or(&mut self.root);
        let subject = &sentence.subject;
        let filters = vec![FILTER_MAP.get(qtype)?];
        let subjects = Scene::select_custom_root(subject, &filters, location);
        return Some(subjects.len() >= 1);
    }

    pub fn select(
        &mut self,
        noun_clause: &NounClause,
        filters: &Vec<&fn(&Value) -> bool>,
    ) -> Vec<Value> {
        let mut results = Vec::new();
        Scene::select_helper(
            &mut results,
            noun_clause,
            filters,
            &mut self.root,
        );
        return results;
    }

    fn select_custom_root(
        noun_clause: &NounClause,
        filters: &Vec<&fn(&Value) -> bool>,
        root: &mut Value,
    ) -> Vec<Value> {
        let mut results = Vec::new();
        Scene::select_helper(&mut results, noun_clause, filters, root);
        return results;
    }

    fn select_helper(
        results: &mut Vec<Value>,
        noun_clause: &NounClause,
        filters: &Vec<&fn(&Value) -> bool>,
        value: &mut Value,
    ) {

        // check the children
        match &mut value["children"] {
            Value::Array(children) => {
                for child in children {
		    if noun_clause.matches(child) {
			// if we fail a filter we don't want to check children
			// or add this item to the results
			for filter in filters {
			    if !filter(child) {
				return;
			    }
			}
			// match found, but still check children
			results.push(child.clone());
		    }
                    Scene::select_helper(results, noun_clause, filters, child);
                }
            }
            _ => (),
        }
    }
}

fn exist(_: &Value) -> bool {
    true
}

fn edible(item: &Value) -> bool {
    match &item["is"] {
        Value::Array(array) => {
            for item in array {
                match item {
                    Value::String(component) => {
                        if component == "edible" {
                            return true;
                        }
                    }
                    _ => (),
                }
            }
        }
        _ => (),
    };
    return false;
}

lazy_static! {
    static ref FILTER_MAP: HashMap<String, fn(&Value) -> bool> = {
        let mut map = HashMap::new();
        map.insert("exist".to_string(), exist as fn(&Value) -> bool);
        map.insert("edible".to_string(), edible as fn(&Value) -> bool);
        map
    };
}

#[cfg(test)]
mod test {
    use super::Scene;
    use cfg::lang::Lang;
    use sentence::NounClause;
    use sentence::Sentence;
    use serde_json::Value;
    use std::fs;

    fn test_scene() -> Value {
        let mut scene =
            fs::read_to_string("rust/test-data/test-scene.json").unwrap();
        serde_json::from_str(&scene).unwrap()
    }

    fn make_lang() -> Lang {
        Lang::from_file(
            "rust/test-data/test-lang-rules.txt",
            "rust/test-data/test-lang-words.txt",
        )
    }

    fn test_sentence(sentence: &str) -> Sentence {
        let lang = make_lang();
        Sentence::from_lang(&lang, sentence).unwrap()
    }

    #[test]
    fn test_ask_exist() {
        let data = test_scene();
        let mut scene = Scene::new(data);
        let sentence = test_sentence("does a red apple exist");
        let result = scene.ask_question(&sentence);
        assert_eq!(true, result);
    }

    #[test]
    fn test_ask_edible_is_true_with_component() {
        let data = test_scene();
        let mut scene = Scene::new(data);
        let sentence = test_sentence("is a red apple edible");
        let result = scene.ask_question(&sentence);
        assert_eq!(true, result);
    }

    #[test]
    fn test_ask_edible_is_false_without_component() {
        let data = test_scene();
        let mut scene = Scene::new(data);
        let lang = make_lang();
        let sentence_exists =
            Sentence::from_lang(&lang, "does a red table exist").unwrap();
        let sentence_edible =
            Sentence::from_lang(&lang, "is a red table edible").unwrap();
        assert_eq!(true, scene.ask_question(&sentence_exists));
        assert_eq!(false, scene.ask_question(&sentence_edible));
    }

    #[test]
    fn test_scene_selects_multiple_items() {
        let data = test_scene();
        let mut scene = Scene::new(data);
        let filters = Vec::new();
        let search_term =
            NounClause::new("apple".to_string(), None, Some("red".to_string()));
        let result = scene.select(&search_term, &filters);
        assert_eq!(
            vec![
                json!({"noun": "apple", "adjectives": ["red", "dirty"], "is": ["edible"]}),
                json!({"noun": "apple", "adjectives": ["blotchy", "red"], "is": ["edible"]}),
            ],
            result
        );
    }
}
