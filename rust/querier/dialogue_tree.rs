use serde::de::{Deserialize, Deserializer, MapAccess, SeqAccess, Visitor};
use serde::ser::{Serialize, SerializeStruct, Serializer};

#[derive(Copy, Clone, Debug, serde::Deserialize, serde::Serialize)]
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

impl Serialize for Box<dyn DialogueNode> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let nt: DialogueType = self.node_type();
        return match nt {
            DialogueType::Select => {
                let sel = self.as_any().downcast_ref::<Select>().unwrap();
                let mut select_serializer =
                    serializer.serialize_struct("select", 1)?;
                select_serializer
                    .serialize_field("character", sel.character())?;
                select_serializer.serialize_field("text", sel.text())?;
                select_serializer
                    .serialize_field("node_type", &sel.node_type())?;
                select_serializer.serialize_field("visited", &sel.visited())?;
                select_serializer
                    .serialize_field("children", sel.children())?;
                select_serializer.end()
            }
            DialogueType::PriorityTalk => {
                let prio_talk =
                    self.as_any().downcast_ref::<PriorityTalk>().unwrap();
                let mut priority_talk_serializer =
                    serializer.serialize_struct("PriorityTalk", 1)?;
                priority_talk_serializer
                    .serialize_field("character", prio_talk.character())?;
                priority_talk_serializer
                    .serialize_field("text", prio_talk.text())?;
                priority_talk_serializer
                    .serialize_field("node_type", &prio_talk.node_type())?;
                priority_talk_serializer
                    .serialize_field("visited", &prio_talk.visited())?;
                priority_talk_serializer
                    .serialize_field("priority", &prio_talk.priority())?;
                priority_talk_serializer
                    .serialize_field("child", prio_talk.next())?;
                priority_talk_serializer.end()
            }
            DialogueType::Talk => {
                let talk = self.as_any().downcast_ref::<Talk>().unwrap();
                let mut talk_serializer =
                    serializer.serialize_struct("Talk", 1)?;
                talk_serializer
                    .serialize_field("character", talk.character())?;
                talk_serializer.serialize_field("text", talk.text())?;
                talk_serializer
                    .serialize_field("node_type", &talk.node_type())?;
                talk_serializer.serialize_field("visited", &talk.visited())?;
                talk_serializer.serialize_field("child", talk.next())?;
                talk_serializer.end()
            }
        };
    }
}

impl<'de> Deserialize<'de> for Box<dyn DialogueNode> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        enum Field {
            Character,
            Text,
            NodeType,
            Visited,
            Children,
            Priority,
            Child,
        };

        impl<'de> Deserialize<'de> for Field {
            fn deserialize<D>(deserializer: D) -> Result<Field, D::Error>
            where
                D: Deserializer<'de>,
            {
                struct FieldVisitor;

                impl<'de> Visitor<'de> for FieldVisitor {
                    type Value = Field;

                    fn expecting(
                        &self,
                        formatter: &mut std::fmt::Formatter,
                    ) -> std::fmt::Result {
                        formatter.write_str("valid struct")
                    }

                    fn visit_str<E>(self, value: &str) -> Result<Field, E>
                    where
                        E: serde::de::Error,
                    {
                        match value {
                            "character" => Ok(Field::Character),
                            "text" => Ok(Field::Text),
                            "node_type" => Ok(Field::NodeType),
                            "visited" => Ok(Field::Visited),
                            "children" => Ok(Field::Children),
                            "Priority" => Ok(Field::Priority),
                            "Child" => Ok(Field::Child),
                            _ => Err(serde::de::Error::unknown_field(
                                value, FIELDS,
                            )),
                        }
                    }
                }

                deserializer.deserialize_identifier(FieldVisitor)
            }
        }

        struct DialogueNodeVisitor;
        impl<'de> Visitor<'de> for DialogueNodeVisitor {
            type Value = Box<dyn DialogueNode>;

            fn expecting(
                &self,
                formatter: &mut std::fmt::Formatter,
            ) -> std::fmt::Result {
                formatter.write_str("struct DialogueNode")
            }

            fn visit_seq<V>(
                self,
                mut seq: V,
            ) -> Result<Box<dyn DialogueNode>, V::Error>
            where
                V: SeqAccess<'de>,
            {
                let character = seq.next_element()?.ok_or_else(|| {
                    serde::de::Error::invalid_length(0, &self)
                })?;
                let text = seq.next_element()?.ok_or_else(|| {
                    serde::de::Error::invalid_length(1, &self)
                })?;
                let node_type = seq.next_element()?.ok_or_else(|| {
                    serde::de::Error::invalid_length(2, &self)
                })?;
                let visited = seq.next_element()?.ok_or_else(|| {
                    serde::de::Error::invalid_length(3, &self)
                })?;
                let children = seq.next_element()?.ok_or_else(|| {
                    serde::de::Error::invalid_length(4, &self)
                })?;
                let priority = seq.next_element()?.ok_or_else(|| {
                    serde::de::Error::invalid_length(5, &self)
                })?;
                let child = seq.next_element()?.ok_or_else(|| {
                    serde::de::Error::invalid_length(6, &self)
                })?;

                let nt: DialogueType = DialogueType::Select;
                return match nt {
                    DialogueType::Select => Ok(Box::new(Select {
                        character,
                        text,
                        node_type,
                        visited,
                        children,
                    })),
                    DialogueType::PriorityTalk => Ok(Box::new(PriorityTalk {
                        character,
                        text,
                        node_type,
                        visited,
                        priority,
                        child,
                    })),
                    DialogueType::Talk => Ok(Box::new(Talk {
                        character,
                        text,
                        node_type,
                        visited,
                        child,
                    })),
                };
            }

            fn visit_map<V>(
                self,
                mut map: V,
            ) -> Result<Box<dyn DialogueNode>, V::Error>
            where
                V: MapAccess<'de>,
            {
                let mut character = None;
                let mut text = None;
                let mut node_type = None;
                let mut visited = None;
                let mut children = None;
                let mut priority = None;
                let mut child = None;

                while let Some(key) = map.next_key()? {
                    match key {
                        Field::Character => {
                            if character.is_some() {
                                return Err(serde::de::Error::duplicate_field(
                                    "character",
                                ));
                            }
                            character = Some(map.next_value()?);
                        }
                        Field::Text => {
                            if text.is_some() {
                                return Err(serde::de::Error::duplicate_field(
                                    "text",
                                ));
                            }
                            text = Some(map.next_value()?);
                        }
                        Field::NodeType => {
                            if node_type.is_some() {
                                return Err(serde::de::Error::duplicate_field(
                                    "node_type",
                                ));
                            }
                            node_type = Some(map.next_value()?);
                        }
                        Field::Visited => {
                            if visited.is_some() {
                                return Err(serde::de::Error::duplicate_field(
                                    "visited",
                                ));
                            }
                            visited = Some(map.next_value()?);
                        }
                        Field::Children => {
                            if children.is_some() {
                                return Err(serde::de::Error::duplicate_field(
                                    "children",
                                ));
                            }
                            children = Some(map.next_value()?);
                        }
                        Field::Priority => {
                            if priority.is_some() {
                                return Err(serde::de::Error::duplicate_field(
                                    "priority",
                                ));
                            }
                            priority = Some(map.next_value()?);
                        }
                        Field::Child => {
                            if child.is_some() {
                                return Err(serde::de::Error::duplicate_field(
                                    "child",
                                ));
                            }
                            child = Some(map.next_value()?);
                        }
                    }
                }

                let character = character.ok_or_else(|| {
                    serde::de::Error::missing_field("character")
                })?;
                let text = text
                    .ok_or_else(|| serde::de::Error::missing_field("text"))?;
                let node_type = node_type.ok_or_else(|| {
                    serde::de::Error::missing_field("node_type")
                })?;
                let visited = visited.ok_or_else(|| {
                    serde::de::Error::missing_field("visited")
                })?;
                let children = children.ok_or_else(|| {
                    serde::de::Error::missing_field("children")
                })?;
                let priority = priority.ok_or_else(|| {
                    serde::de::Error::missing_field("priority")
                })?;
                let child = child
                    .ok_or_else(|| serde::de::Error::missing_field("child"))?;

                let nt: DialogueType = DialogueType::Select;
                return match nt {
                    DialogueType::Select => Ok(Box::new(Select {
                        character,
                        text,
                        node_type,
                        visited,
                        children,
                    })),
                    DialogueType::PriorityTalk => Ok(Box::new(PriorityTalk {
                        character,
                        text,
                        node_type,
                        visited,
                        priority,
                        child,
                    })),
                    DialogueType::Talk => Ok(Box::new(Talk {
                        character,
                        text,
                        node_type,
                        visited,
                        child,
                    })),
                };
            }
        }

        const FIELDS: &'static [&'static str] =
            &["character", "text", "node_type", "visited"];
        deserializer.deserialize_struct(
            "DialogueNode",
            FIELDS,
            DialogueNodeVisitor,
        )
    }
}

#[derive(Debug, serde::Serialize)]
pub struct Select {
    character: &'static str,
    text: &'static str,
    node_type: DialogueType,
    visited: bool,
    children: Vec<Box<dyn DialogueNode>>,
}

impl Select {
    pub fn add_child(&mut self, child: Box<dyn DialogueNode>) {
        self.children.push(child);
    }

    fn children(&self) -> &Vec<Box<dyn DialogueNode>> {
        &self.children
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

#[derive(Debug, serde::Serialize)]
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

#[derive(Debug, serde::Serialize)]
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
