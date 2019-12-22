//use erased_serde::Serialize;
use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Debug, Deserialize, Serialize)]
pub enum DialogueType {
    Select,
    PriorityTalk,
    Talk,
}

pub trait DialogueNode: std::any::Any + std::fmt::Display {
    fn as_any(&self) -> &dyn std::any::Any;
    fn character(&self) -> &'static str;
    fn text(&self) -> &'static str;
    fn node_type(&self) -> DialogueType;
    fn visited(&self) -> bool;
    fn set_visited(&mut self);
}

impl std::fmt::Debug for Box<dyn DialogueNode> {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        let nt: DialogueType = self.node_type();
        return match nt {
            DialogueType::Select => {
                let sel = self.as_any().downcast_ref::<Select>().unwrap();
                write!(
                    f,
                    "character: {}
text: {}
node_type: {:?}
visited: {}",
                    sel.character(),
                    sel.text(),
                    sel.node_type(),
                    sel.visited()
                )
            }
            DialogueType::PriorityTalk => {
                let prio_talk =
                    self.as_any().downcast_ref::<PriorityTalk>().unwrap();
                write!(
                    f,
                    "character: {}
text: {}
node_type: {:?}
visited: {}
priority: {}
child: {:?}",
                    prio_talk.character(),
                    prio_talk.text(),
                    prio_talk.node_type(),
                    prio_talk.visited(),
                    prio_talk.priority(),
                    prio_talk.next()
                )
            }
            DialogueType::Talk => {
                let talk = self.as_any().downcast_ref::<Talk>().unwrap();
                write!(
                    f,
                    "character: {}
text: {}
node_type: {:?}
visited: {}
child: {:?}",
                    talk.character(),
                    talk.text(),
                    talk.node_type(),
                    talk.visited(),
                    talk.next()
                )
            }
        };
    }
}

// impl Serialize for Box<dyn DialogueNode> {}

#[derive(Debug)]
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

    pub fn num_children(&self) -> usize {
        self.children.len()
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
    fn as_any(&self) -> &std::any::Any {
        self
    }

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
visited: {},
num_children: {}",
            self.character(),
            self.text(),
            self.node_type(),
            self.visited(),
            self.num_children(),
        )
    }
}

#[derive(Debug)]
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
    fn as_any(&self) -> &std::any::Any {
        self
    }

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
        let child = self.next().is_some();
        write!(
            f,
            "character: {}
text: {}
node_type: {:?}
visited: {}
priority: {},
has_child: {}",
            self.character(),
            self.text(),
            self.node_type(),
            self.visited,
            self.priority(),
            child,
        )
    }
}

#[derive(Debug)]
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
    fn as_any(&self) -> &std::any::Any {
        self
    }

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
        let child = self.next().is_some();
        write!(
            f,
            "character: {}
text: {}
node_type: {:?}
visited: {}
has_child: {}",
            self.character(),
            self.text(),
            self.node_type(),
            self.visited,
            child,
        )
    }
}
