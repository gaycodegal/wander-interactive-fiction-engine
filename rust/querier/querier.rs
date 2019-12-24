use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use diesel::*;
use serde::Deserialize;
use std::env::current_exe;
use std::fs::{remove_file, File};
use std::io::Read;

use crate::models::*;

#[derive(Deserialize, Debug)]
/// Datafile Struct is a struct so we can bind all the information in a dump file.
struct DataFile {
    /// The vector of items in the file.
    items: Option<Vec<Item>>,
    /// The vector of locations in the file.
    locations: Option<Vec<Location>>,
    /// The vector of characters in the file.
    characters: Option<Vec<Character>>,
    /// The vector of dialogues in the file.
    dialogues: Option<Vec<Dialogue>>,
    /// The nodes of dialogues in the file.
    nodes: Option<Vec<Node>>,
}

impl Querier {
    /// Creates a new querier existance from an existing sqlite3 db relative to the app.
    ///
    /// # Arguements
    ///
    /// * `file_name` - The name of the sqlite3 db file.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::Querier;
    /// let querier = Querier::new("file_name.db");
    /// ```
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

    /// Creates a new querier and a new db file.
    ///
    /// # Arguements
    ///
    /// * `file_name` - The name of the sqlite3 db file to be created.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::Querier;
    /// let querier = Querier::new_file("file_name.db");
    /// ```
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

    /// Given a querier instance setup the database tables and indexes.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::Querier;
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// ```
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

        sql_query("CREATE TABLE dialogues (id INTEGER PRIMARY KEY, characters TEXT NOT NULL, flags TEXT, location TEXT, priority INTEGER, dialogue TEXT NOT NULL)").execute(&self.connection).expect("Failed to create items table.");
        sql_query("CREATE UNIQUE INDEX dialogues_id ON dialogues (id)")
            .execute(&self.connection)
            .expect("Failed to create dialogue index.");

        sql_query(
            "CREATE TABLE nodes (id INTEGER PRIMARY KEY, data TEXT NOT NULL)",
        )
        .execute(&self.connection)
        .expect("Failed to create items table.");
        sql_query("CREATE UNIQUE INDEX nodes_id ON nodes (id)")
            .execute(&self.connection)
            .expect("Failed to create dialogue index.");
    }

    /// Given a querier instance setup dup data from the DataFile struct into the db tables.
    fn dump_data(&self, data: DataFile) {
        if let Some(items) = data.items {
            self.insert_items(items);
        }

        if let Some(locations) = data.locations {
            self.insert_locations(locations);
        }

        if let Some(characters) = data.characters {
            self.insert_characters(characters);
        }

        if let Some(dialogues) = data.dialogues {
            self.insert_dialogues(dialogues);
        }

        // if let Some(nodes) = data.nodes {
        //     self.insert_nodes(nodes);
        // }
    }

    /// Given a querier instance and a json/toml file, dump the file data to the tables in database.
    ///
    /// # Arguements
    ///
    /// * `path` - The path and file name of the file you are giving.
    /// * `file_type` - The type of file you are dumping from. JSON or TOML.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// ```
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

    /// Given a querier instance query items from the database instance. If all arguments are None it queries all items.
    ///
    /// # Arguements
    ///
    /// * `name` - Optional the text contained in the item names. Will query all similar items to name given.
    /// * `attributes` - Optional a vector of strings that represent an attribute on items you can query by. Item must contain all attributes specified.
    /// * `components` - Optional a vector of strings that represent an component on items you can query by. Item must contain all components specified.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// let items = querier.query_items(Some("apple"), None, None);
    /// ```
    pub fn query_items(
        &self,
        name: Option<&str>,
        attributes: Option<Vec<&str>>,
        components: Option<Vec<&str>>,
    ) -> Vec<Item> {
        use crate::schema::items;

        let mut query = items::table.into_boxed();

        if let Some(name) = name {
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

    /// Given a querier instance and item name fetch it if it exists.
    ///
    /// # Arguements
    ///
    /// * `item_name` - The name of the item you wish to fetch. Must be the exact name.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// let item = querier.get_item("Test_Item");
    /// ```
    pub fn get_item(&self, item_name: &str) -> Item {
        use crate::schema::items::dsl::*;

        items
            .find(item_name)
            .get_result::<Item>(&self.connection)
            .expect("Failed to get item.")
    }

    /// Given a querier instance and item struct to insert into the database instance.
    ///
    /// # Arguements
    ///
    /// * `item` - The item struct to be inserted.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{Item, FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.insert_item(Item {
    /// name: String::from("Test_Item"),
    /// description: String::from("Test item for insert testing."),
    /// attributes: String::from("test,debug,insert"),
    /// components: String::from("{'test': 'test'}"),
    /// });
    /// ```
    pub fn insert_item(&self, item: Item) -> usize {
        use crate::schema::items::dsl::*;

        diesel::insert_into(items)
            .values(&item)
            .execute(&self.connection)
            .expect("Error inserting item.")
    }

    /// Given a querier instance and vector of item structs to be inserted into the database instance.
    ///
    /// # Arguements
    ///
    /// * `items` - The vector of item structs to be inserted.
    pub fn insert_items(&self, insert_items: Vec<Item>) -> usize {
        use crate::schema::items::dsl::*;

        diesel::insert_into(items)
            .values(&insert_items)
            .execute(&self.connection)
            .expect("Error inserting items.")
    }

    /// Given a querier instance and item name remove it if it exists.
    ///
    /// # Arguements
    ///
    /// * `item_name` - The name of the item you wish to remove. Must be the exact name.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.remove_item("Test_Item");
    /// ```
    pub fn remove_item(&self, item_name: &str) -> usize {
        use crate::schema::items::dsl::*;

        diesel::delete(items.find(item_name))
            .execute(&self.connection)
            .expect("Failed to delete item.")
    }

    /// Given a querier instance, item name, and an Item struct to update the item with.
    ///
    /// # Arguements
    ///
    /// * `item_name` - The name of the item you wish to update. Must be the exact name.
    /// * `updated_item` - The updated Item struct to replace the old one.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{Item, FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.update_item("Test_Item", Item {
    /// name: String::from("Test_Item_Changed_name"),
    /// description: String::from("Test item for insert testing."),
    /// attributes: String::from("test,debug,insert"),
    /// components: String::from("{'test': 'test'}"),
    /// });
    /// ```
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

    /// Given a querier instance query locations from the database instance. If all arguments are None it queries all locations.
    ///
    /// # Arguements
    ///
    /// * `name` - Optional the text contained in the location names. Will query all similar locations to name given.
    /// * `items` - Optional a vector of strings that represent an item in a location you can query by. Location must contain all items specified.
    /// * `characters` - Optional vector of strings that represent an character in a location you can query by. Location must contain all characters specified.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// let locations = querier.query_locations(Some("kitchen"), None, None);
    /// ```
    pub fn query_locations(
        &self,
        name: Option<&str>,
        items: Option<Vec<&str>>,
        characters: Option<Vec<&str>>,
    ) -> Vec<Location> {
        use crate::schema::locations;

        let mut query = locations::table.into_boxed();

        if let Some(name) = name {
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

    /// Given a querier instance and location name fetch it if it exists.
    ///
    /// # Arguements
    ///
    /// * `location_name` - The name of the location you wish to fetch. Must be the exact name.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// let location = querier.get_location("Test_Location");
    /// ```
    pub fn get_location(&self, location_name: &str) -> Location {
        use crate::schema::locations::dsl::*;

        locations
            .find(location_name)
            .get_result::<Location>(&self.connection)
            .expect("Failed to get location.")
    }

    /// Given a querier instance and location struct to insert into the database instance.
    ///
    /// # Arguements
    ///
    /// * `location` - The location struct to be inserted.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{Location, FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.insert_location(Location {
    /// name: String::from("Test_Location"),
    /// description: String::from("Test location for insert testing."),
    /// items: String::from("random string"),
    /// neighbors: String::from("vitae"),
    /// characters: String::from("umbra"),
    /// });
    /// ```
    pub fn insert_location(&self, location: Location) -> usize {
        use crate::schema::locations::dsl::*;

        diesel::insert_into(locations)
            .values(&location)
            .execute(&self.connection)
            .expect("Error inserting location.")
    }

    /// Given a querier instance and vector of location structs to be inserted into the database instance.
    ///
    /// # Arguements
    ///
    /// * `locations` - The vector of location structs to be inserted.
    pub fn insert_locations(&self, insert_locations: Vec<Location>) -> usize {
        use crate::schema::locations::dsl::*;

        diesel::insert_into(locations)
            .values(&insert_locations)
            .execute(&self.connection)
            .expect("Error inserting locations.")
    }

    /// Given a querier instance and location name remove it if it exists.
    ///
    /// # Arguements
    ///
    /// * `location_name` - The name of the location you wish to remove. Must be the exact name.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.remove_location("Test_Location");
    /// ```
    pub fn remove_location(&self, location_name: &str) -> usize {
        use crate::schema::locations::dsl::*;

        diesel::delete(locations.find(location_name))
            .execute(&self.connection)
            .expect("Failed to delete location")
    }

    /// Given a querier instance, location name, and an Location struct to update the location with.
    ///
    /// # Arguements
    ///
    /// * `location_name` - The name of the location you wish to update. Must be the exact name.
    /// * `updated_location` - The updated Location struct to replace the old one.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{Location, FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.update_location("Test_Location", Location {
    /// name: String::from("Test_Location_Changed_name"),
    /// description: String::from("Test location for insert testing."),
    /// items: String::from("apple,bug"),
    /// neighbors: String::from("{'up stairs': 'hallway'}"),
    /// characters: String::from("mom,dad"),
    /// });
    /// ```
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

    /// Given a querier instance query characters from the database instance. If all arguments are None it queries all characters.
    ///
    /// # Arguements
    ///
    /// * `name` - Optional the text contained in the character names. Will query all similar characters to name given.
    /// * `components` - Optional a vector of strings that represent an component on a character you can query by. Character must contain all componenets specified.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// let locations = querier.query_characters(Some("dad"), None);
    /// ```
    pub fn query_characters(
        &self,
        name: Option<&str>,
        components: Option<Vec<&str>>,
    ) -> Vec<Character> {
        use crate::schema::characters;

        let mut query = characters::table.into_boxed();

        if let Some(name) = name {
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

    /// Given a querier instance and character name fetch it if it exists.
    ///
    /// # Arguements
    ///
    /// * `character_name` - The name of the character you wish to fetch. Must be the exact name.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// let character = querier.get_character("Test_Character");
    /// ```
    pub fn get_character(&self, character_name: &str) -> Character {
        use crate::schema::characters::dsl::*;

        characters
            .find(character_name)
            .get_result::<Character>(&self.connection)
            .expect("Failed to get character.")
    }

    /// Given a querier instance and character struct to insert into the database instance.
    ///
    /// # Arguements
    ///
    /// * `character` - The character struct to be inserted.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{Character, FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.insert_character(Character {
    /// name: String::from("Test_Characte"),
    /// components: String::from("{ \"interactable\": true }"),
    /// });
    /// ```
    pub fn insert_character(&self, character: Character) -> usize {
        use crate::schema::characters::dsl::*;

        diesel::insert_into(characters)
            .values(&character)
            .execute(&self.connection)
            .expect("Error inserting character.")
    }

    /// Given a querier instance and vector of character structs to be inserted into the database instance.
    ///
    /// # Arguements
    ///
    /// * `characters` - The vector of character structs to be inserted.
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

    /// Given a querier instance and character name remove it if it exists.
    ///
    /// # Arguements
    ///
    /// * `character_name` - The name of the character you wish to remove. Must be the exact name.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.remove_character("Test_Character");
    /// ```
    pub fn remove_character(&self, character_name: &str) -> usize {
        use crate::schema::characters::dsl::*;

        diesel::delete(characters.find(character_name))
            .execute(&self.connection)
            .expect("Failed to delete character")
    }

    /// Given a querier instance, character name, and an Character struct to update the character with.
    ///
    /// # Arguements
    ///
    /// * `character_name` - The name of the character you wish to update. Must be the exact name.
    /// * `updated_character` - The updated Character struct to replace the old one.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{Character, FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.update_character("Test_Character", Character {
    /// name: String::from("Test_Character_Changed_name"),
    /// components: String::from("{'test': 'test'}"),
    /// });
    /// ```
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

    /// Given a querier instance query dialogues from the database instance. If all arguments are None it queries all dialogies.
    ///
    /// # Arguements
    ///
    /// * `characters` - Optional a vector of strings that represent an character on a dialogue you can query by. Will query all similar locations to name given.
    /// * `flags` - Optional a vector of strings that represent an flag on a dialogue you can query by. Dialogue must contain all items specified.
    /// * `location` - Optional a vector of strings that represent an location on a dialogue you can query by. Dialogue must contain all characters specified.
    /// * `dialogue_snippets` - Optional a vector of strings that represent an dialogue snippet on a dialogue. Dialogue must contain all characters specified.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// let dialogues = querier.query_dialogies(Some("dad"), None, None);
    /// ```
    pub fn query_dialogues(
        &self,
        characters: Option<Vec<&str>>,
        flags: Option<Vec<&str>>,
        location: Option<&str>,
        dialogue_snippets: Option<Vec<&str>>,
    ) -> Vec<Dialogue> {
        use crate::schema::dialogues;

        let mut query = dialogues::table.into_boxed();

        if let Some(characters) = characters {
            for character in characters {
                query = query.filter(
                    dialogues::characters.like(format!("%{}%", character)),
                );
            }
        }

        if let Some(flags) = flags {
            for flag in flags {
                query =
                    query.filter(dialogues::flags.like(format!("%{}%", flag)));
            }
        }

        if let Some(location) = location {
            query = query
                .filter(dialogues::location.like(format!("%{}%", location)));
        }

        if let Some(dialogue_snippets) = dialogue_snippets {
            for dialogue_snippet in dialogue_snippets {
                query = query.filter(
                    dialogues::dialogue.like(format!("%{}%", dialogue_snippet)),
                );
            }
        }

        query
            .load::<Dialogue>(&self.connection)
            .expect("Error loading items.")
    }

    /// Given a querier instance and dialogue name fetch it if it exists.
    ///
    /// # Arguements
    ///
    /// * `dialogue_name` - The name of the dialogue you wish to fetch. Must be the exact name.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// let dialogue = querier.get_dialogue("Test_Dialogue");
    /// ```
    pub fn get_dialogue(&self, dialogue_id: i32) -> Dialogue {
        use crate::schema::dialogues::dsl::*;

        dialogues
            .find(dialogue_id)
            .get_result::<Dialogue>(&self.connection)
            .expect("Failed to get dialogue.")
    }

    /// Given a querier instance and dialogue struct to insert into the database instance.
    ///
    /// # Arguements
    ///
    /// * `dialogue` - The dialogue struct to be inserted.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{Dialogue, FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.insert_dialogue(Dialogue {
    /// name: String::from("Test_Characte"),
    /// components: String::from("{ \"interactable\": true }"),
    /// });
    /// ```
    pub fn insert_dialogue(&self, dialogue_struct: Dialogue) -> usize {
        use crate::schema::dialogues::dsl::*;

        diesel::insert_into(dialogues)
            .values(&dialogue_struct)
            .execute(&self.connection)
            .expect("Error inserting dialogue.")
    }

    /// Given a querier instance and vector of dialogue structs to be inserted into the database instance.
    ///
    /// # Arguements
    ///
    /// * `dialogues` - The vector of dialogue structs to be inserted.
    pub fn insert_dialogues(&self, insert_dialogues: Vec<Dialogue>) -> usize {
        use crate::schema::dialogues::dsl::*;

        diesel::insert_into(dialogues)
            .values(&insert_dialogues)
            .execute(&self.connection)
            .expect("Error inserting dialogues.")
    }

    /// Given a querier instance and dialogue name remove it if it exists.
    ///
    /// # Arguements
    ///
    /// * `dialogue_id` - The id of the dialogue you wish to remove. Must be the exact name.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.remove_dialogue("Test_Dialogue");
    /// ```
    pub fn remove_dialogue(&self, dialogue_id: i32) -> usize {
        use crate::schema::dialogues::dsl::*;

        diesel::delete(dialogues.find(dialogue_id))
            .execute(&self.connection)
            .expect("Failed to delete dialogue")
    }

    /// Given a querier instance, dialogue name, and an Dialogue struct to update the dialogue with.
    ///
    /// # Arguements
    ///
    /// * `dialogue_id` - The id of the dialogue you wish to update. Must be the exact name.
    /// * `updated_dialogue` - The updated Dialogue struct to replace the old one.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{Dialogue, FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.update_dialogue("Test_Dialogue", Dialogue {
    /// name: String::from("Test_Dialogue_Changed_name"),
    /// components: String::from("{'test': 'test'}"),
    /// });
    /// ```
    pub fn update_dialogue(
        &self,
        id_num: i32,
        updated_dialogue: Dialogue,
    ) -> usize {
        use crate::schema::dialogues::dsl::*;

        diesel::update(dialogues.filter(id.eq(id_num)))
            .set((
                characters.eq(&updated_dialogue.characters),
                flags.eq(&updated_dialogue.flags),
                location.eq(&updated_dialogue.location),
                dialogue.eq(updated_dialogue.dialogue_string()),
            ))
            .execute(&self.connection)
            .expect("Error updating dialogue.")
    }

    /// Given a querier instance and node name fetch it if it exists.
    ///
    /// # Arguements
    ///
    /// * `node_id` - The id of the node you wish to fetch.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// let node = querier.get_node(0);
    /// ```
    pub fn get_node(&self, node_id: i32) -> Node {
        use crate::schema::nodes::dsl::*;

        nodes
            .find(node_id)
            .get_result::<Node>(&self.connection)
            .expect("Failed to get node.")
    }

    /// Given a querier instance and node struct to insert into the database instance.
    ///
    /// # Arguements
    ///
    /// * `node` - The node struct to be inserted.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{Node, FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.insert_node(Node {
    /// id: 0,
    /// data: String::from("{\"story\":[{\"who\":\"dad\",\"what\":\"What the fuck do you think you were doing?\"},{\"who\":\"mom\",\"what\":\"You are are grounded!\"}],\"choices\":[{\"what\":\"Fuck you guys.\",\"next\":0},{\"what\":\"I was trying to help her.\",\"next\":1}],\"visited\":false}"),
    /// });
    /// ```
    pub fn insert_node(&self, node: Node) -> usize {
        use crate::schema::nodes::dsl::*;

        diesel::insert_into(nodes)
            .values(&node)
            .execute(&self.connection)
            .expect("Error inserting node.")
    }

    /// Given a querier instance and vector of node structs to be inserted into the database instance.
    ///
    /// # Arguements
    ///
    /// * `nodes` - The vector of node structs to be inserted.
    pub fn insert_nodes(&self, insert_nodes: Vec<Node>) -> usize {
        use crate::schema::nodes::dsl::*;

        diesel::insert_into(nodes)
            .values(&insert_nodes)
            .execute(&self.connection)
            .expect("Error inserting nodes.")
    }

    /// Given a querier instance, node name, and an Node struct to update the node with.
    ///
    /// # Arguements
    ///
    /// * `node_id` - The id of the node you wish to update.
    /// * `updated_node` - The updated Node struct to replace the old one.
    ///
    /// # Example
    ///
    /// ```
    /// use querier::models::{Node, FileType, Querier};
    /// let querier = Querier::new_file("file_name.db");
    /// querier.setup_db();
    /// querier.dump_from_file("/path/to/data.json", FileType::JSON).expect("Unsuccesful dump to database");
    /// querier.update_node(0, Node {
    /// id: 0,
    /// data: String::from("{\"story\":[{\"who\":\"dad\",\"what\":\"What the fuck do you think you were doing?\"},{\"who\":\"mom\",\"what\":\"You are are grounded!\"}],\"choices\":[{\"what\":\"Fuck you guys.\",\"next\":0},{\"what\":\"I was trying to help her.\",\"next\":1}],\"visited\":false}"),
    /// });
    /// ```
    pub fn update_node(&self, node_id: i32, updated_node: Node) -> usize {
        use crate::schema::nodes::dsl::*;

        diesel::update(nodes.filter(id.eq(node_id)))
            .set((data.eq(updated_node.data),))
            .execute(&self.connection)
            .expect("Error updating node.")
    }
}
