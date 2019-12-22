//use erased_serde::Serialize;
use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Debug, Deserialize, Serialize)]
pub enum DialogueType {
    Select,
    PriorityTalk,
    Talk,
}

pub trait DialogueNode: std::any::Any + std::fmt::Display {
    fn character(&self) -> &'static str;
    fn text(&self) -> &'static str;
    fn node_type(&self) -> DialogueType;
    fn visited(&self) -> bool;
    fn set_visited(&mut self);
}

pub struct Select {
    character: &'static str,
    text: &'static str,
    node_type: DialogueType,
    pub visited: bool,
    children: Vec<Box<dyn DialogueNode>>,
}

impl Select {
    pub fn add_child(&mut self, child: Box<dyn DialogueNode>) {
        self.children.push(child);
    }

    pub fn select_child(&self, child: usize) -> &Box<dyn DialogueNode> {
        self.children.get(child).unwrap()
    }

    pub fn new(character: &'static str, text: &'static str) -> Self {
        Select {
            character: character,
            text: text,
            node_type: DialogueType::Select,
            visited: false,
            children: Vec::new(),
        }
    }
}

impl DialogueNode for Select {
    fn character(&self) -> &'static str {
        self.character
    }

    fn text(&self) -> &'static str {
        self.text
    }

    fn node_type(&self) -> DialogueType {
        self.node_type
    }

    fn visited(&self) -> bool {
        self.visited
    }

    fn set_visited(&mut self) {
        self.visited = !self.visited;
    }
}

impl std::fmt::Display for Select {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(
            f,
            "character: {}
text: {}
node_type: {:?}
visited: {}",
            self.character(),
            self.text(),
            self.node_type(),
            self.visited
        )
    }
}

pub struct PriorityTalk {
    character: &'static str,
    text: &'static str,
    node_type: DialogueType,
    visited: bool,
    child: Option<Box<dyn DialogueNode>>,
    priority: i32,
}

impl PriorityTalk {
    pub fn priority(&self) -> i32 {
        self.priority
    }

    pub fn set_priority(&mut self, priority: i32) {
        self.priority = priority;
    }

    pub fn next(&self) -> &Option<Box<dyn DialogueNode>> {
        &self.child
    }

    pub fn new(character: &'static str, text: &'static str) -> Self {
        PriorityTalk {
            character: character,
            text: text,
            node_type: DialogueType::PriorityTalk,
            visited: false,
            child: None,
            priority: 0,
        }
    }
}

impl DialogueNode for PriorityTalk {
    fn character(&self) -> &'static str {
        self.character
    }

    fn text(&self) -> &'static str {
        self.text
    }

    fn node_type(&self) -> DialogueType {
        self.node_type
    }

    fn visited(&self) -> bool {
        self.visited
    }

    fn set_visited(&mut self) {
        self.visited = !self.visited;
    }
}

impl std::fmt::Display for PriorityTalk {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(
            f,
            "character: {}
text: {}
node_type: {:?}
visited: {}
priority: {}",
            self.character(),
            self.text(),
            self.node_type(),
            self.visited,
            self.priority()
        )
    }
}

pub struct Talk {
    character: &'static str,
    text: &'static str,
    node_type: DialogueType,
    visited: bool,
    child: Option<Box<dyn DialogueNode>>,
}

impl Talk {
    pub fn next(&self) -> &Option<Box<dyn DialogueNode>> {
        &self.child
    }

    pub fn new(character: &'static str, text: &'static str) -> Self {
        Talk {
            character: character,
            text: text,
            node_type: DialogueType::Talk,
            visited: false,
            child: None,
        }
    }
}

impl DialogueNode for Talk {
    fn character(&self) -> &'static str {
        self.character
    }

    fn text(&self) -> &'static str {
        self.text
    }

    fn node_type(&self) -> DialogueType {
        self.node_type
    }

    fn visited(&self) -> bool {
        self.visited
    }

    fn set_visited(&mut self) {
        self.visited = !self.visited;
    }
}

impl std::fmt::Display for Talk {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(
            f,
            "character: {}
text: {}
node_type: {:?}
visited: {}",
            self.character(),
            self.text(),
            self.node_type(),
            self.visited
        )
    }
}
