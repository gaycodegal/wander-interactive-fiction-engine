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
	let question = &sentence.verb;
	let unfiltered = vec![];
	let location = match &sentence.prep {
	    Some(prep) => Some(self.select(&prep.noun_clause, &unfiltered)),
	    None => None,
	};
	if location.is_none() && sentence.prep.is_some() {
	    return false;
	}
	let location = match &location {
	    Some(matches) => matches.first(),
	    None => None,
	}.unwrap_or(self.root);
	let subject = &sentence.subject;
	let filters = vec![exist as fn(&Value) -> bool];
	let subjects = self.select_custom_root(subject, &filters, location);
	return subjects.len() >= 1;
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
	root: &Value
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

fn exist(value: &Value) -> bool {
    return true;
}

#[cfg(test)]
mod test {
    use super::Scene;
    use sentence::NounClause;

    #[test]
    fn test_scene_selects_multiple_items() {
        let mut data = json!({
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
        });
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
