use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use diesel::*;
use serde::Deserialize;
use std::fs::File;
use std::io::{Error, Read};
use std::path::PathBuf;

use crate::models::*;

#[derive(Deserialize, Debug)]
struct DataFile {
    items: Vec<Item>,
    locations: Vec<Location>,
    characters: Vec<Character>,
}

impl Querier {
    pub fn new(database_url: &str) -> Option<Querier> {
        let path_buffer = PathBuf::from(database_url);

        if !path_buffer.exists() {
            return None;
        }

        let path = path_buffer
            .into_os_string()
            .into_string()
            .expect("String conversion of db path failed.");

        let conn = SqliteConnection::establish(&path)
            .unwrap_or_else(|_| panic!("Error connecting to {}", database_url));

        let res = conn.execute("PRAGMA foreign_keys = ON");

        if res.is_ok() {
            return Some(Querier { connection: conn });
        }

        None
    }

    pub fn new_file(database_url: &str) -> Option<Querier> {
        let path_buffer = PathBuf::from(database_url);
        let path = path_buffer
            .into_os_string()
            .into_string()
            .expect("String conversion of db path failed.");

        let conn = SqliteConnection::establish(&path)
            .unwrap_or_else(|_| panic!("Error connecting to {}", database_url));

        let res = conn.execute("PRAGMA foreign_keys = ON");

        if res.is_ok() {
            return Some(Querier { connection: conn });
        }

        None
    }

    pub fn setup_db(&self) {
        sql_query("CREATE TABLE items (name TEXT PRIMARY KEY, description TEXT, attributes TEXT, components TEXT)").execute(&self.connection).expect("Failed to create items table.");
        sql_query("CREATE UNIQUE INDEX item_names ON items (name)")
            .execute(&self.connection)
            .expect("Failed to create items index.");

        sql_query("CREATE TABLE locations (name TEXT PRIMARY KEY, description TEXT, items TEXT, neighbors TEXT, characters TEXT)").execute(&self.connection).expect("Failed to create items table.");
        sql_query("CREATE UNIQUE INDEX location_names ON locations (name)")
            .execute(&self.connection)
            .expect("Failed to create items index.");

        sql_query(
            "CREATE TABLE characters (name TEXT PRIMARY KEY, components TEXT)",
        )
        .execute(&self.connection)
        .expect("Failed to create items table.");
        sql_query("CREATE UNIQUE INDEX character_names ON characters (name)")
            .execute(&self.connection)
            .expect("Failed to create items index.");
    }

    fn dump_data(&self, data: DataFile) {
        self.insert_items(data.items);
        self.insert_locations(data.locations);
        self.insert_characters(data.characters);
    }

    pub fn dump_from_file(
        &self,
        path: &str,
        file_type: FileType,
    ) -> Result<(), Error> {
        let mut file = File::open(path)?;
        let mut file_content = String::new();
        file.read_to_string(&mut file_content)
            .expect("Failed to read file into string");

        match file_type {
            FileType::TOML => {
                let data_file: DataFile = toml::from_str(&file_content)?;

                self.dump_data(data_file);
            }
            FileType::JSON => {
                let data_file: DataFile = serde_json::from_str(&file_content)?;

                self.dump_data(data_file);
            }
        }

        Ok(())
    }

    pub fn query_items(
        &self,
        name: &str,
        attributes: Option<Vec<&str>>,
        components: Option<Vec<&str>>,
    ) -> Vec<Item> {
        use crate::schema::items;

        let mut query = items::table.into_boxed();

        if !name.is_empty() {
            return query
                .filter(items::name.like(format!("%{}%", name)))
                .load::<Item>(&self.connection)
                .expect("Error loading items.");
        }

        if let Some(attrs) = attributes {
            for attr in attrs {
                query =
                    query.filter(items::attributes.like(format!("%{}%", attr)));
            }
        }

        if let Some(comps) = components {
            for comp in comps {
                query =
                    query.filter(items::components.like(format!("%{}%", comp)));
            }
        }

        query
            .load::<Item>(&self.connection)
            .expect("Error loading items.")
    }

    pub fn insert_item(&self, item: Item) -> bool {
        use crate::schema::items::dsl::*;

        diesel::insert_into(items)
            .values(&item)
            .execute(&self.connection)
            .expect("Error inserting item.")
            == 1
    }

    pub fn insert_items(&self, insert_items: Vec<Item>) -> bool {
        use crate::schema::items::dsl::*;

        diesel::insert_into(items)
            .values(&insert_items)
            .execute(&self.connection)
            .expect("Error inserting items.")
            == insert_items.len()
    }

    pub fn remove_item(&self, _item_name: &str) -> bool {
        true
    }

    pub fn update_item(&self, item_name: &str, updated_item: Item) -> bool {
        use crate::schema::items::dsl::*;

        diesel::update(items.filter(name.eq(item_name)))
            .set((
                name.eq(updated_item.name),
                description.eq(updated_item.description),
                attributes.eq(updated_item.attributes),
                components.eq(updated_item.components),
            ))
            .execute(&self.connection)
            .expect("Error updating item.")
            == 1
    }

    pub fn query_locations(
        &self,
        name: String,
        items: Vec<String>,
        characters: Vec<String>,
    ) -> Vec<Location> {
        use crate::schema::locations;

        let mut query = locations::table.into_boxed();

        if !name.is_empty() {
            return query
                .filter(locations::name.like(format!("%{}%", name)))
                .load::<Location>(&self.connection)
                .expect("Error loading items.");
        }

        if !items.is_empty() {
            for item in items {
                query =
                    query.filter(locations::items.like(format!("%{}%", item)));
            }
        }

        if !characters.is_empty() {
            for chara in characters {
                query = query
                    .filter(locations::characters.like(format!("%{}%", chara)));
            }
        }

        query
            .load::<Location>(&self.connection)
            .expect("Error loading items.")
    }

    pub fn insert_location(&self, location: Location) -> bool {
        use crate::schema::locations::dsl::*;

        diesel::insert_into(locations)
            .values(&location)
            .execute(&self.connection)
            .expect("Error inserting location.")
            == 1
    }

    pub fn insert_locations(&self, insert_locations: Vec<Location>) -> bool {
        use crate::schema::locations::dsl::*;

        diesel::insert_into(locations)
            .values(&insert_locations)
            .execute(&self.connection)
            .expect("Error inserting locations.")
            == insert_locations.len()
    }

    pub fn update_location(
        &self,
        location_name: String,
        updated_location: Location,
    ) -> bool {
        use crate::schema::locations::dsl::*;

        diesel::update(locations.filter(name.eq(location_name)))
            .set((
                name.eq(updated_location.name),
                description.eq(updated_location.description),
                items.eq(updated_location.items),
                neighbors.eq(updated_location.neighbors),
                characters.eq(updated_location.characters),
            ))
            .execute(&self.connection)
            .expect("Error updating location.")
            == 1
    }

    pub fn query_characters(
        &self,
        name: String,
        components: Vec<String>,
    ) -> Vec<Character> {
        use crate::schema::characters;

        let mut query = characters::table.into_boxed();

        if !name.is_empty() {
            return query
                .filter(characters::name.like(format!("%{}%", name)))
                .load::<Character>(&self.connection)
                .expect("Error loading items.");
        }

        if !components.is_empty() {
            for comp in components {
                query = query
                    .filter(characters::components.like(format!("%{}%", comp)));
            }
        }

        query
            .load::<Character>(&self.connection)
            .expect("Error loading items.")
    }

    pub fn insert_character(&self, character: Character) -> bool {
        use crate::schema::characters::dsl::*;

        diesel::insert_into(characters)
            .values(&character)
            .execute(&self.connection)
            .expect("Error inserting character.")
            == 1
    }

    pub fn insert_characters(&self, insert_characters: Vec<Character>) -> bool {
        use crate::schema::characters::dsl::*;

        diesel::insert_into(characters)
            .values(&insert_characters)
            .execute(&self.connection)
            .expect("Error inserting characters.")
            == insert_characters.len()
    }

    pub fn update_character(
        &self,
        character_name: String,
        updated_character: Character,
    ) -> bool {
        use crate::schema::characters::dsl::*;

        diesel::update(characters.filter(name.eq(character_name)))
            .set((
                name.eq(updated_character.name),
                components.eq(updated_character.components),
            ))
            .execute(&self.connection)
            .expect("Error updating character.")
            == 1
    }

    pub fn query_dialogues(
        &self,
        characters: Vec<String>,
        flags: Vec<String>,
        locations: Vec<String>,
        dialogue_snippets: Vec<String>,
    ) -> Vec<Dialogue> {
        use crate::schema::dialogues;

        let mut query = dialogues::table.into_boxed();

        if !characters.is_empty() {
            for character in characters {
                query = query.filter(
                    dialogues::characters.like(format!("%{}%", character)),
                );
            }
        }

        if !flags.is_empty() {
            for flag in &flags {
                query =
                    query.filter(dialogues::flags.like(format!("%{}%", flag)));
            }
        }

        if !locations.is_empty() {
            for location in locations {
                query = query.filter(
                    dialogues::location.like(format!("%{}%", location)),
                );
            }
        }

        if !dialogue_snippets.is_empty() {
            for dialogue_snippet in dialogue_snippets {
                query = query.filter(
                    dialogues::dialogue.like(format!("%{}%", dialogue_snippet)),
                );
            }
        }

        if !flags.is_empty() {
            for flag in flags {
                query =
                    query.filter(dialogues::flags.like(format!("%{}%", flag)));
            }
        }

        query
            .load::<Dialogue>(&self.connection)
            .expect("Error loading items.")
    }

    pub fn insert_dialogue(&self, dialogue_text: Dialogue) -> bool {
        use crate::schema::dialogues::dsl::*;

        diesel::insert_into(dialogues)
            .values(&dialogue_text)
            .execute(&self.connection)
            .expect("Error inserting dialogue.")
            == 1
    }

    pub fn insert_dialogues(&self, insert_dialogues: Vec<Dialogue>) -> bool {
        use crate::schema::dialogues::dsl::*;

        diesel::insert_into(dialogues)
            .values(&insert_dialogues)
            .execute(&self.connection)
            .expect("Error inserting dialogues.")
            == insert_dialogues.len()
    }

    // pub fn update_dialogue(self, id_num: i32, updated_dialogue: Dialogue) -> bool {
    //     use crate::schema::dialogues::dsl::*;

    //     diesel::update(dialogues.filter(id.eq(id)))
    //         .set((
    //             characters.eq(updated_dialogue.characters),
    //             flags.eq(updated_dialogue.flags),
    //             location.eq(updated_dialogue.location),
    //             dialogue.eq(updated_dialogue.dialogue),
    //         ))
    //         .execute(&self.connection)
    //         .expect("Error updating dialogue.") == 1
    // }
}
