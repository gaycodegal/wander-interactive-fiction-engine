use sentence::NounClause;
use sentence::Sentence;
use serde_json::Value;

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
        println!("{}", qtype);
        let filters = vec![exist as fn(&Value) -> bool];
        let subjects = self.select_custom_root(subject, &filters, location);
        return Some(subjects.len() >= 1);
    }

    pub fn select(
        &self,
        noun_clause: &NounClause,
        filters: &Vec<fn(&Value) -> bool>,
    ) -> Vec<Value> {
        let mut results = Vec::new();
        self.select_child_helper(&mut results, noun_clause, filters, self.root);
        return results;
    }

    fn select_custom_root(
        &self,
        noun_clause: &NounClause,
        filters: &Vec<fn(&Value) -> bool>,
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
        filters: &Vec<fn(&Value) -> bool>,
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
        filters: &Vec<fn(&Value) -> bool>,
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
    return true;
}

#[cfg(test)]
mod test {
    use super::Scene;
    use cfg::lang::Lang;
    use sentence::NounClause;
    use sentence::Sentence;
    use serde_json::Value;

    fn test_scene() -> Value {
        json!({
            "children": [
        // WANT
        {"noun": "apple", "adjectives": ["red", "dirty"]},
        // not apple
        {"noun": "table", "children": [
            // not apple
            {"noun": "table", "adjectives": ["red"]},
            // WANT
            {"noun": "apple", "adjectives": ["blotchy", "red"]},
            // not red
            {"noun": "apple", "adjectives": ["clean"]},
        ]},
            ],
        })
    }

    fn make_lang() -> Lang {
        Lang::from_file(
            "rust/test-data/test-lang-rules.txt",
            "rust/test-data/test-lang-words.txt",
        )
    }

    fn test_sentence() -> Sentence {
        let lang = make_lang();
        let text = "does a red apple exist";
        let ast = lang.parse_sentence(text).unwrap();
        Sentence::from_ast(&ast).unwrap()
    }

    #[test]
    fn test_ask_question() {
        let mut data = test_scene();
        let scene = Scene::new(&mut data);
        let sentence = test_sentence();
        let result = scene.ask_question(&sentence);
        println!("result is {}", result);
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
                json!({"noun": "apple", "adjectives": ["red", "dirty"]}),
                json!({"noun": "apple", "adjectives": ["blotchy", "red"]}),
            ],
            result
        );
    }
}
