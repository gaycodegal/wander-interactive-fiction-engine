extern crate cfg;
extern crate ift;
#[macro_use]
extern crate serde_json;
extern crate rusqlite;

use rusqlite::{Connection, Result};
use rusqlite::NO_PARAMS;
use cfg::lang::Lang;
use ift::scene::Scene;
use ift::sentence::Sentence;
use std::io;
use std::io::Write;

fn main() {
    let _ = sqlite_test();
    lang_test();
}

fn sqlite_test() -> Result<()> {
    let conn = Connection::open("cats.db")?;

    conn.execute(
        "create table if not exists cat_colors (
             id integer primary key,
             name text not null unique
         )",
        NO_PARAMS,
    )?;

    Ok(())
}

fn lang_test() -> Option<()> {
    let rules = "
S: Verb NounClause | Verb NounClause PrepClause | QuestionVerb NounClause Type | QuestionVerb NounClause PrepClause Type
NounClause: Count ANoun | Adjective Noun | noun
PrepClause: Prep NounClause
ANoun: Adjective Noun | noun
QuestionVerb: qVerb
Adjective: adjective
Type: type
Prep: prep
Verb: verb
Noun: noun
Count: definiteArticle | indefiniteArticle | number
";
    let words = "
an indefiniteArticle
a indefiniteArticle
the definiteArticle
eat verb
on prep
apple noun
table noun
is qVerb
does qVerb
edible type
exist type
red adjective
green adjective
clean adjective
blotchy adjective
dirty adjective
";
    let mut lang = Lang::new();
    lang.init_rules(rules);
    lang.init_words(words);
    let mut data = json!({
        "children": [
    {"noun": "apple", "adjectives": ["red", "dirty"]},
    {"noun": "table", "children": [
        {"noun": "table", "adjectives": ["red"]},
        {"noun": "apple", "adjectives": ["blotchy", "red"]},
        {"noun": "apple", "adjectives": ["clean"]},
    ]},
        ],
    });

    println!("grammar:\n{}\n", rules);
    println!("words:\n{}\n", words);
    println!("the world:\n\n{}\n", data);

    loop {
        let reader = io::stdin();
        let mut sentence = String::new();

	print!("> ");
	io::stdout().flush().ok()?;
        reader.read_line(&mut sentence).ok()?;
	if sentence.len() == 0 {
	    println!("");
	    return Some(());
	}
	
        let sentence = match lang.parse_sentence(&sentence) {
            Err(error) => {
                println!("Error:\n{}", error);
                None
            }
            Ok(ast) => Sentence::from_ast(&ast),
        };
        let scene = Scene::new(&mut data);

        match sentence {
            Some(sentence) => {
                if sentence.is_question {
                    println!("Answer: {}", scene.ask_question(&sentence));
                } else {
                    println!("Ask a question")
                }
            }
            None => println!("Not a sentence"),
        }
	println!();
    }
}
