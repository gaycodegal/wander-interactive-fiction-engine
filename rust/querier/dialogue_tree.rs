#[derive(Copy, Clone, Debug)]
pub enum DialogueType {
    Select,
    PriortyTalk,
    Talk,
}

pub trait DialogueNode {
    fn new(character: &'static str, text: &'static str) -> Self;
    fn character(&self) -> &'static str;
    fn text(&self) -> &'static str;
    fn node_type(&self) -> DialogueType;
    fn visited(&self) -> bool;
    fn set_visited(&mut self);
}

#[derive(Clone, Debug)]
pub struct Select<T: DialogueNode> {
    character: &'static str,
    text: &'static str,
    node_type: DialogueType,
    visited: bool,
    children: Vec<T>,
}

impl<T: DialogueNode> Select<T> {
    pub fn add_child(&mut self, child: T) {
        self.children.push(child);
    }

    pub fn children(&self) -> &Vec<T> {
        &self.children
    }

    pub fn select_child(&self, child: usize) -> &T {
        &self.children.get(child).unwrap()
    }
}

impl<T: DialogueNode> DialogueNode for Select<T> {
    fn new(character: &'static str, text: &'static str) -> Self {
        Select {
            character: character,
            text: text,
            node_type: DialogueType::Select,
            visited: false,
            children: Vec::new(),
        }
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

#[derive(Clone, Debug)]
pub struct PriorityTalk<T: DialogueNode> {
    pub character: &'static str,
    pub text: &'static str,
    pub node_type: DialogueType,
    pub visited: bool,
    pub child: Option<T>,
    pub priority: i32,
}

impl<T: DialogueNode> PriorityTalk<T> {
    pub fn priority(&self) -> i32 {
        self.priority
    }

    pub fn set_priority(&mut self, priority: i32) {
        self.priority = priority;
    }

    pub fn next(&self) -> &T {
        &self.child.as_ref().unwrap()
    }
}

impl<T: DialogueNode> DialogueNode for PriorityTalk<T> {
    fn new(character: &'static str, text: &'static str) -> Self {
        PriorityTalk {
            character: character,
            text: text,
            node_type: DialogueType::Select,
            visited: false,
            child: None,
            priority: 0,
        }
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

#[derive(Clone, Debug)]
pub struct Talk<T: DialogueNode> {
    pub character: &'static str,
    pub text: &'static str,
    pub node_type: DialogueType,
    pub visited: bool,
    pub child: Option<T>,
}

impl<T: DialogueNode> Talk<T> {
    pub fn next(&self) -> &T {
        &self.child.as_ref().unwrap()
    }
}

impl<T: DialogueNode> DialogueNode for Talk<T> {
    fn new(character: &'static str, text: &'static str) -> Self {
        Talk {
            character: character,
            text: text,
            node_type: DialogueType::Select,
            visited: false,
            child: None,
        }
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
