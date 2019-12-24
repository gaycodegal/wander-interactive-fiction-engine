use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
/// Talk struct represents somone talking in a dialogue.
pub struct Talk<'a> {
    /// Who field represents who's talking.
    pub who: &'a str,
    /// What field represents what's being said.
    pub what: &'a str,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
/// Choice struct represents the choice in a dialogue.
pub struct Choice<'a> {
    #[serde(borrow)]
    /// What field represents what's being said.
    pub what: &'a str,
    /// Next field represents the id of the next Node in the database.
    pub next: i32,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
/// StoryNode is a struct to represent the json format of a node data field.
pub struct StoryNode<'a> {
    #[serde(borrow)]
    /// The dialogue for the story node.
    pub story: Vec<Talk<'a>>,
    #[serde(borrow)]
    /// The choices for the next node if it exists.
    pub select: Option<Vec<Choice<'a>>>,
    /// Has this story node been visited before.
    pub visited: bool,
}
