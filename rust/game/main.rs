#[macro_use]
extern crate serde_json;

extern crate gluon;

extern crate cfg;
extern crate ift;
extern crate querier;

use cfg::lang::Lang;
use ift::scene::Scene;
use ift::sentence::Sentence;
use querier::dialogue_tree::*;
use querier::models::*;
use std::fs;
use std::io;
use std::io::Write;
use std::path::PathBuf;

use dyon::{error, run};

fn main() {
    query_test();
    lang_test();
}

fn query_test() {
    let mut db_path_buffer = PathBuf::from("/tmp");
    db_path_buffer.push("test_file_reads.db");

    let db_path = db_path_buffer
        .into_os_string()
        .into_string()
        .expect("String conversion of path failed.");

    let q = Querier::new_file(&db_path).expect("valid db connection");
    q.setup_db();

    let mut json_path_buffer = PathBuf::from("/tmp");
    json_path_buffer.push("test_dump_json.json");

    let json_path = json_path_buffer
        .into_os_string()
        .into_string()
        .expect("String conversion of path failed.");

    q.dump_from_file(&json_path, FileType::JSON)
        .expect("unsuccesful json dump to db");

    let dia = q.get_dialogue(0);
    println!("dia {:?}", dia.dialogue_string());
    println!("dia {:?}", dia.dialogue());

    let story = vec![
        Talk {
            who: "dad",
            what: "What the fuck do you think you were doing?",
        },
        Talk {
            who: "mom",
            what: "You are are grounded!",
        },
    ];
    let select = vec![
        Choice {
            what: "Fuck you guys.",
            next: 0,
        },
        Choice {
            what: "I was trying to help her.",
            next: 1,
        },
    ];
    let mut tree = StoryNode {
        story: story,
        select: Some(select),
        visited: false,
    };
    println!("The debugs:\n{:?}", tree);

    let serialized = serde_json::to_string(&tree).unwrap();
    println!("\ntree_json: {}", serialized);
}

fn lang_test() -> Option<()> {
    let rules =
        fs::read_to_string("rust/test-data/test-lang-rules.txt").unwrap();
    let words =
        fs::read_to_string("rust/test-data/test-lang-words.txt").unwrap();
    let mut lang = Lang::new();
    lang.init_rules(&rules);
    lang.init_words(&words);
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

    println!("grammar:\n\n{}", rules);
    println!("words:\n{}", words);
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
