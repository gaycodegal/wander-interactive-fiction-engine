use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct Talk<'a> {
    pub who: &'a str,
    pub what: &'a str,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct Choice<'a> {
    #[serde(borrow)]
    pub what: &'a str,
    pub next: i32,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct Select<'a> {
    #[serde(borrow)]
    pub choices: Vec<Choice<'a>>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct StoryNode<'a> {
    #[serde(borrow)]
    pub story: Vec<Talk<'a>>,
    #[serde(borrow)]
    pub select: Option<Select<'a>>,
    pub visited: bool,
}
