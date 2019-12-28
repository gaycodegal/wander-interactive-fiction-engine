use sentence::NounClause;
use sentence::Sentence;
use serde_json::Value;
use std::collections::HashMap;

pub struct Scene<'lifetime> {
    root: &'lifetime Value,
}

impl<'lifetime> Scene<'lifetime> {
    pub fn new<'outside>(root: &'outside mut Value) -> Scene {
        Scene { root: root }
    }

    pub fn ask_question<'question>(&self, sentence: &Sentence) -> bool {
        let result = self.ask_question_helper(sentence);
        match result {
            Some(result) => result,
            None => false,
        }
    }

    fn ask_question_helper<'question>(
        &self,
        sentence: &Sentence,
    ) -> Option<bool> {
        let qtype = &sentence.q_type.to_owned()?;

        let unfiltered = vec![];

        let location = match &sentence.prep {
            Some(prep) => Some(self.select(&prep.noun_clause, &unfiltered)),
            None => None,
        };
        if location.is_none() && sentence.prep.is_some() {
            return Some(false);
        }
        let location = match &location {
            Some(matches) => matches.first(),
            None => None,
        }
        .unwrap_or(self.root);
        let subject = &sentence.subject;
        let filters = vec![FILTER_MAP.get(qtype)?];
        let subjects = self.select_custom_root(subject, &filters, location);
        return Some(subjects.len() >= 1);
    }

    pub fn select(
        &self,
        noun_clause: &NounClause,
        filters: &Vec<&fn(&Value) -> bool>,
    ) -> Vec<Value> {
        let mut results = Vec::new();
        self.select_child_helper(&mut results, noun_clause, filters, self.root);
        return results;
    }

    fn select_custom_root(
        &self,
        noun_clause: &NounClause,
        filters: &Vec<&fn(&Value) -> bool>,
        root: &Value,
    ) -> Vec<Value> {
        let mut results = Vec::new();
        self.select_child_helper(&mut results, noun_clause, filters, root);
        return results;
    }

    fn select_child_helper(
        &self,
        results: &mut Vec<Value>,
        noun_clause: &NounClause,
        filters: &Vec<&fn(&Value) -> bool>,
        value: &Value,
    ) {
        // check the children
        match &value["children"] {
            Value::Array(children) => {
                for child in children {
                    self.select_helper(results, noun_clause, filters, child);
                }
            }
            _ => (),
        }
    }

    fn select_helper(
        &self,
        results: &mut Vec<Value>,
        noun_clause: &NounClause,
        filters: &Vec<&fn(&Value) -> bool>,
        value: &Value,
    ) {
        if noun_clause.matches(value) {
            // if we fail a filter we don't want to check children
            // or add this item to the results
            for filter in filters {
                if !filter(value) {
                    return;
                }
            }
            // match found, but still check children
            results.push(value.clone());
        }

        // check the children
        match &value["children"] {
            Value::Array(children) => {
                for child in children {
                    self.select_helper(results, noun_clause, filters, child);
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
        let scene =
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
        let mut data = test_scene();
        let scene = Scene::new(&mut data);
        let sentence = test_sentence("does a red apple exist");
        let result = scene.ask_question(&sentence);
        assert_eq!(true, result);
    }

    #[test]
    fn test_ask_edible_is_true_with_component() {
        let mut data = test_scene();
        let scene = Scene::new(&mut data);
        let sentence = test_sentence("is a red apple edible");
        let result = scene.ask_question(&sentence);
        assert_eq!(true, result);
    }

    #[test]
    fn test_ask_edible_is_false_without_component() {
        let mut data = test_scene();
        let scene = Scene::new(&mut data);
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
        let mut data = test_scene();
        let scene = Scene::new(&mut data);
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
