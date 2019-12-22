use crate::schema::*;
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use serde::Deserialize;
// use serde_json::Result;

use dialogue_tree::*;

/// FileType to describe a type of file.
pub enum FileType {
    JSON,
    TOML,
}

/// Querier the object used to query the different aspects in the game.
pub struct Querier {
    pub connection: SqliteConnection,
}

#[derive(Insertable, Queryable, Clone, Debug, Deserialize, PartialEq)]
#[table_name = "items"]
/// Item is a struct to contain all information about a item.
pub struct Item {
    /// The unique name of the item.
    pub name: String,
    /// The description of the item.
    pub description: Option<String>,
    /// The attributes of the item, represented as comma seperated string.
    pub attributes: Option<String>,
    /// The components attached to an item, represented as a JSON formatted string.
    pub components: Option<String>,
}

#[derive(Insertable, Queryable, Clone, Debug, Deserialize, PartialEq)]
#[table_name = "locations"]
/// Location is struct to contain all information about a location.
pub struct Location {
    /// The unique name of the location.
    pub name: String,
    /// The description of the location.
    pub description: Option<String>,
    /// The items in the location, represented as comma seperated string.
    pub items: Option<String>,
    /// The names of the neighboring locations, represented as a JSON formatted string.
    pub neighbors: Option<String>,
    /// The characters in the location, represented as comma seperated string.
    pub characters: Option<String>,
}

impl Location {
    /// Returns a Vector of Items from the database based off the location items field.
    ///
    /// # Arguements
    ///
    /// * `querier` - A querier object to query the items table.
    pub fn items(self, querier: Querier) -> Vec<Item> {
        use crate::schema::items::dsl::*;
        let connection = querier.connection;
        let mut items_in_room: Vec<Item> = Vec::new();

        if let Some(items_string) = self.items {
            for item in items_string.split(",") {
                if !item.is_empty() {
                    items_in_room.push(
                        items
                            .find(item)
                            .first(&connection)
                            .expect("Could not look up item."),
                    );
                }
            }
        }

        items_in_room
    }

    /// Returns a Vector of dialogues from the database based off the location name field.
    ///
    /// # Arguements
    ///
    /// * `querier` - A querier object to query the items table.
    pub fn dialogues(self, querier: Querier) -> Vec<Dialogue> {
        use crate::schema::dialogues::dsl::*;
        let connection = querier.connection;

        dialogues
            .filter(location.like(format!("%{}%", self.name)))
            .load::<Dialogue>(&connection)
            .expect("Could not look up dialogues.")
    }
}

#[derive(Insertable, Queryable, Clone, Debug, Deserialize, PartialEq)]
#[table_name = "characters"]
/// Character is struct to contain all information about a character.
pub struct Character {
    /// The unique name of the character.
    pub name: String,
    /// The components attached to an character, represented as a JSON formatted string.
    pub components: Option<String>,
}

impl Character {
    /// Returns a Vector of dialogues from the database based off the character name field.
    ///
    /// # Arguements
    ///
    /// * `querier` - A querier object to query the items table.
    pub fn dialogues(self, querier: Querier) -> Vec<Dialogue> {
        use crate::schema::dialogues::dsl::*;
        let connection = querier.connection;

        dialogues
            .filter(characters.like(format!("%{}%", self.name)))
            .load::<Dialogue>(&connection)
            .expect("Could not look up dialogues.")
    }
}
#[derive(Insertable, Queryable, Clone, Debug, Deserialize, PartialEq)]
#[table_name = "dialogues"]
/// Dualogue is struct to contain all information about a dialogue.
pub struct Dialogue {
    /// The unique id of the location.
    pub id: i32,
    /// The characters in the dialogue, represented as a comma seperated string.
    pub characters: String,
    /// The flags needed to start a dialogue, represented as a comma seperated string.
    pub flags: Option<String>,
    /// The location the dialogue takes place.
    pub location: String,
    /// The dialogue tree structure, represented as a JSON formatted string.
    dialogue: String,
}

impl Dialogue {
    pub fn dialogue_string(&self) -> &str {
        &self.dialogue
    }

    // fn dialogue(&self) -> Talk {
    //     let tree: Talk = serde_json::from_str(&self.dialogue).ok().unwrap();
    //     return tree;
    // }
}
