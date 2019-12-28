use cfg::ast::AST;
use cfg::ast_search::ASTSearch;
use serde_json::Value;
use std::fmt;

pub struct NounClause {
    pub noun: String,
    count: Option<String>,
    pub adjective: Option<String>,
}

impl NounClause {
    pub fn new(
        noun: String,
        count: Option<String>,
        adjective: Option<String>,
    ) -> NounClause {
        NounClause {
            noun: noun,
            count: count,
            adjective: adjective,
        }
    }

    pub fn from_ast<'ast>(search: ASTSearch<'ast>) -> Option<NounClause> {
        let noun = search.get_terminal("noun")?;
        let count = search
            .get_terminal("number")
            .or(search.get_terminal("definiteArticle"))
            .or(search.get_terminal("indefiniteArticle"));
        let adjective = search.get_terminal("adjective");
        Some(NounClause::new(noun, count, adjective))
    }

    pub fn matches(&self, value: &Value) -> bool {
	// do we match the noun
        match &value["noun"] {
            Value::String(noun) => {
                if &self.noun != noun {
                    return false;
                }
            }
            _ => return false,
        }

	// do we match the adjective
        if self.adjective.is_none() {
            return true;
        }
        if let Value::Array(adjectives) = &value["adjectives"] {
            for adjective in adjectives {
                // adjectives listed for an object should be non null
                let found = match adjective {
                    Value::String(adjective) => match &self.adjective {
                        Some(desired) => {
                            if adjective == desired {
                                true
                            } else {
                                false
                            }
                        }
                        _ => true,
                    },
                    _ => false,
                };
                if found {
                    return true;
                }
            }
        }
        return false;
    }
}

impl fmt::Display for NounClause {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.write_str("NounClause(")?;
        fmt.write_str(&self.noun)?;
        fmt.write_str(", ")?;
        optional_write(fmt, &self.count)?;
        fmt.write_str(", ")?;
        optional_write(fmt, &self.adjective)?;
        fmt.write_str(")")?;
        Ok(())
    }
}

pub struct PrepClause {
    pub prep: String,
    pub noun_clause: NounClause,
}

impl PrepClause {
    pub fn new(prep: String, noun_clause: NounClause) -> PrepClause {
        PrepClause {
            prep: prep,
            noun_clause: noun_clause,
        }
    }

    pub fn from_ast<'ast>(search: ASTSearch<'ast>) -> Option<PrepClause> {
        let prep = search.get_terminal("prep")?;
        let noun_clause =
            NounClause::from_ast(search.child_tree("NounClause"))?;
        Some(PrepClause::new(prep, noun_clause))
    }
}

impl fmt::Display for PrepClause {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.write_str("PrepClause(")?;
        fmt.write_str(&self.prep)?;
        fmt.write_str(", ")?;
        self.noun_clause.fmt(fmt)?;
        fmt.write_str(")")?;
        Ok(())
    }
}

pub struct Sentence {
    pub verb: String,
    pub subject: NounClause,
    pub prep: Option<PrepClause>,
    pub q_type: Option<String>,
    pub is_question: bool,
}

impl Sentence {
    pub fn new(
        subject: NounClause,
        verb: String,
        prep: Option<PrepClause>,
        q_type: Option<String>,
        is_question: bool,
    ) -> Sentence {
        Sentence {
            subject: subject,
            verb: verb,
            prep: prep,
            q_type: q_type,
            is_question: is_question,
        }
    }

    pub fn from_ast(ast: &AST) -> Option<Sentence> {
        let search = ASTSearch::new(Some(ast));
        let subject = NounClause::from_ast(search.child_tree("NounClause"))?;
        let mut verb = search.get_terminal("verb");
        let prep = PrepClause::from_ast(search.child_tree("PrepClause"));
        let mut is_question = false;
        let mut q_type = None;
        if verb.is_none() {
            is_question = true;
            verb = search.get_terminal("qVerb");
            q_type = search.get_terminal("type");
        }
        let verb = verb?;
        Some(Sentence::new(subject, verb, prep, q_type, is_question))
    }
}

impl fmt::Display for Sentence {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.write_str("Sentence(")?;
        self.subject.fmt(fmt)?;
        fmt.write_str(", ")?;
        fmt.write_str(&self.verb)?;
        fmt.write_str(", ")?;
        if let Some(prep) = &self.prep {
            prep.fmt(fmt)?;
        } else {
            fmt.write_str("None")?;
        }

        fmt.write_str(", ")?;
        optional_write(fmt, &self.q_type)?;
        fmt.write_str(", ")?;
        self.is_question.fmt(fmt)?;
        fmt.write_str(")")?;
        Ok(())
    }
}

fn optional_write(
    fmt: &mut fmt::Formatter,
    o_str: &Option<String>,
) -> fmt::Result {
    if let Some(o_str) = o_str {
        fmt.write_str(&o_str)?;
    } else {
        fmt.write_str("None")?;
    }
    Ok(())
}

#[cfg(test)]
mod test {
    use super::Sentence;
    use cfg::lang::Lang;

    fn make_lang() -> Lang {
        Lang::from_file("rust/test-data/test-lang-rules.txt", "rust/test-data/test-lang-words.txt")
    }

    #[test]
    fn test_sentence_from_ast() {
        let lang = make_lang();
	let test = "eat the green apple on a table";
	let ast = lang.parse_sentence(test).unwrap();
	let sentence = Sentence::from_ast(&ast).unwrap();
	assert_eq!("Sentence(NounClause(apple, the, green), eat, PrepClause(on, NounClause(table, a, None)), None, false)", format!("{}", sentence));
    }

    #[test]
    fn test_question_sentence_from_ast() {
        let lang = make_lang();
	let test = "does the green apple on a table exist";
	let ast = lang.parse_sentence(test).unwrap();
	let sentence = Sentence::from_ast(&ast).unwrap();
	assert_eq!("Sentence(NounClause(apple, the, green), does, PrepClause(on, NounClause(table, a, None)), exist, true)", format!("{}", sentence));
    }
}
