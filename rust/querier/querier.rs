use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use diesel::*;
use serde::Deserialize;
use std::env::current_exe;
use std::fs::{remove_file, File};
use std::io::Read;

use crate::models::*;

#[derive(Deserialize, Debug)]
struct DataFile {
    items: Vec<Item>,
    locations: Vec<Location>,
    characters: Vec<Character>,
}

impl Querier {
    pub fn new(file_name: &str) -> Option<Querier> {
        let mut path_buffer = current_exe().expect("Failed to get exec path.");
        path_buffer.pop();
        path_buffer.push(file_name);

        if !path_buffer.exists() {
            return None;
        }

        let path = path_buffer
            .into_os_string()
            .into_string()
            .expect("String conversion of db path failed.");

        let conn = SqliteConnection::establish(&path)
            .unwrap_or_else(|_| panic!("Error connecting to {}", path));

        let res = conn.execute("PRAGMA foreign_keys = ON");

        if res.is_ok() {
            return Some(Querier { connection: conn });
        }

        None
    }

    pub fn new_file(file_name: &str) -> Option<Querier> {
        let mut path_buffer = current_exe().expect("Failed to get exec path.");
        path_buffer.pop();
        path_buffer.push(file_name);

        if path_buffer.exists() {
            remove_file(&path_buffer).expect("Failed to remove old file.");
        }

        let path = path_buffer
            .into_os_string()
            .into_string()
            .expect("String conversion of db path failed.");

        let conn = SqliteConnection::establish(&path)
            .unwrap_or_else(|_| panic!("Error connecting to {}", path));

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

        sql_query("CREATE TABLE locations (name TEXT PRIMARY KEY, description TEXT, items TEXT, neighbors TEXT, characters TEXT)").execute(&self.connection).expect("Failed to create locations table.");
        sql_query("CREATE UNIQUE INDEX location_names ON locations (name)")
            .execute(&self.connection)
            .expect("Failed to create locations index.");

        sql_query(
            "CREATE TABLE characters (name TEXT PRIMARY KEY, components TEXT)",
        )
        .execute(&self.connection)
        .expect("Failed to create characters table.");
        sql_query("CREATE UNIQUE INDEX character_names ON characters (name)")
            .execute(&self.connection)
            .expect("Failed to create characters index.");
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
    ) -> Result<(), std::io::Error> {
        let mut path_buffer = current_exe().expect("Failed to get exec path.");
        path_buffer.pop();
        path_buffer.push(path);

        let full_path = path_buffer
            .into_os_string()
            .into_string()
            .expect("String conversion of db path failed.");

        let mut file = File::open(full_path)?;
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

    pub fn get_item(&self, item_name: &str) -> Item {
        use crate::schema::items::dsl::*;

        items
            .find(item_name)
            .get_result::<Item>(&self.connection)
            .expect("Failed to get item.")
    }

    pub fn insert_item(&self, item: Item) -> usize {
        use crate::schema::items::dsl::*;

        diesel::insert_into(items)
            .values(&item)
            .execute(&self.connection)
            .expect("Error inserting item.")
    }

    pub fn insert_items(&self, insert_items: Vec<Item>) -> usize {
        use crate::schema::items::dsl::*;

        diesel::insert_into(items)
            .values(&insert_items)
            .execute(&self.connection)
            .expect("Error inserting items.")
    }

    pub fn remove_item(&self, item_name: &str) -> usize {
        use crate::schema::items::dsl::*;

        diesel::delete(items.find(item_name))
            .execute(&self.connection)
            .expect("Failed to delete item.")
    }

    pub fn update_item(&self, item_name: &str, updated_item: Item) -> usize {
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
    }

    pub fn query_locations(
        &self,
        name: &str,
        items: Option<Vec<String>>,
        characters: Option<Vec<String>>,
    ) -> Vec<Location> {
        use crate::schema::locations;

        let mut query = locations::table.into_boxed();

        if !name.is_empty() {
            return query
                .filter(locations::name.like(format!("%{}%", name)))
                .load::<Location>(&self.connection)
                .expect("Error loading items.");
        }

        if let Some(items) = items {
            for item in items {
                query =
                    query.filter(locations::items.like(format!("%{}%", item)));
            }
        }

        if let Some(charas) = characters {
            for chara in charas {
                query = query
                    .filter(locations::characters.like(format!("%{}%", chara)));
            }
        }

        query
            .load::<Location>(&self.connection)
            .expect("Error loading items.")
    }

    pub fn get_location(&self, location_name: &str) -> Location {
        use crate::schema::locations::dsl::*;

        locations
            .find(location_name)
            .get_result::<Location>(&self.connection)
            .expect("Failed to get location.")
    }

    pub fn insert_location(&self, location: Location) -> usize {
        use crate::schema::locations::dsl::*;

        diesel::insert_into(locations)
            .values(&location)
            .execute(&self.connection)
            .expect("Error inserting location.")
    }

    pub fn insert_locations(&self, insert_locations: Vec<Location>) -> usize {
        use crate::schema::locations::dsl::*;

        diesel::insert_into(locations)
            .values(&insert_locations)
            .execute(&self.connection)
            .expect("Error inserting locations.")
    }

    pub fn remove_location(&self, location_name: &str) -> usize {
        use crate::schema::locations::dsl::*;

        diesel::delete(locations.find(location_name))
            .execute(&self.connection)
            .expect("Failed to delete location")
    }

    pub fn update_location(
        &self,
        location_name: &str,
        updated_location: Location,
    ) -> usize {
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
    }

    pub fn query_characters(
        &self,
        name: &str,
        components: Option<Vec<String>>,
    ) -> Vec<Character> {
        use crate::schema::characters;

        let mut query = characters::table.into_boxed();

        if !name.is_empty() {
            return query
                .filter(characters::name.like(format!("%{}%", name)))
                .load::<Character>(&self.connection)
                .expect("Error loading items.");
        }

        if let Some(comps) = components {
            for comp in comps {
                query = query
                    .filter(characters::components.like(format!("%{}%", comp)));
            }
        }

        query
            .load::<Character>(&self.connection)
            .expect("Error loading items.")
    }

    pub fn get_character(&self, character_name: &str) -> Character {
        use crate::schema::characters::dsl::*;

        characters
            .find(character_name)
            .get_result::<Character>(&self.connection)
            .expect("Failed to get character.")
    }

    pub fn insert_character(&self, character: Character) -> usize {
        use crate::schema::characters::dsl::*;

        diesel::insert_into(characters)
            .values(&character)
            .execute(&self.connection)
            .expect("Error inserting character.")
    }

    pub fn insert_characters(
        &self,
        insert_characters: Vec<Character>,
    ) -> usize {
        use crate::schema::characters::dsl::*;

        diesel::insert_into(characters)
            .values(&insert_characters)
            .execute(&self.connection)
            .expect("Error inserting characters.")
    }

    pub fn remove_character(&self, character_name: &str) -> usize {
        use crate::schema::characters::dsl::*;

        diesel::delete(characters.find(character_name))
            .execute(&self.connection)
            .expect("Failed to delete character")
    }

    pub fn update_character(
        &self,
        character_name: &str,
        updated_character: Character,
    ) -> usize {
        use crate::schema::characters::dsl::*;

        diesel::update(characters.filter(name.eq(character_name)))
            .set((
                name.eq(updated_character.name),
                components.eq(updated_character.components),
            ))
            .execute(&self.connection)
            .expect("Error updating character.")
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

    // pub fn get_dialogue(&self, dialogue_name: &str) -> Dialogue {
    //     use crate::schema::dialogues::dsl::*;

    //     dialogues
    //         .find(dialogue_name)
    //         .get_result::<Dialogue>(&self.connection)
    //         .expect("Failed to get dialogue.")
    // }

    pub fn insert_dialogue(&self, dialogue_text: Dialogue) -> usize {
        use crate::schema::dialogues::dsl::*;

        diesel::insert_into(dialogues)
            .values(&dialogue_text)
            .execute(&self.connection)
            .expect("Error inserting dialogue.")
    }

    pub fn insert_dialogues(&self, insert_dialogues: Vec<Dialogue>) -> usize {
        use crate::schema::dialogues::dsl::*;

        diesel::insert_into(dialogues)
            .values(&insert_dialogues)
            .execute(&self.connection)
            .expect("Error inserting dialogues.")
    }

    // pub fn remove_dialogue(&self, dialogue_name: &str) -> usize {
    //     use crate::schema::dialogues::dsl::*;

    //     diesel::delete(dialogues.find(dialogue_name))
    //         .execute(&self.connection)
    //         .expect("Failed to delete dialogue")
    // }

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
