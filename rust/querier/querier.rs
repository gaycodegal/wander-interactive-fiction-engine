use diesel;
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;

use crate::models::{Character, Dialogue, Item, Location, Querier};

impl<'a> Querier<'a> {
    pub fn new(database_url: &str) -> Querier {
        Querier {
            connection: SqliteConnection::establish(&database_url)
                .unwrap_or_else(|_| {
                    panic!("Error connecting to {}", database_url)
                }),
            database_url: database_url,
        }
    }

    pub fn query_items(
        self,
        name: String,
        attributes: Vec<String>,
        components: Vec<String>,
    ) -> Vec<Item> {
        use crate::schema::items;

        let mut query = items::table.into_boxed();

        if !name.is_empty() {
            return query
                .filter(items::name.like(format!("%{}%", name)))
                .load::<Item>(&self.connection)
                .expect("Error loading items.");
        }

        if !attributes.is_empty() {
            for attr in attributes {
                query =
                    query.filter(items::attributes.like(format!("%{}%", attr)));
            }
        }

        if !components.is_empty() {
            for comp in components {
                query =
                    query.filter(items::components.like(format!("%{}%", comp)));
            }
        }

        query
            .load::<Item>(&self.connection)
            .expect("Error loading items.")
    }

    pub fn insert_item(self, item: Item) -> bool {
        use crate::schema::items::dsl::*;

        diesel::insert_into(items)
            .values(&item)
            .execute(&self.connection)
            .expect("Error inserting item.")
            == 1
    }

    pub fn insert_items(self, insert_items: Vec<Item>) -> bool {
        use crate::schema::items::dsl::*;

        diesel::insert_into(items)
            .values(&insert_items)
            .execute(&self.connection)
            .expect("Error inserting items.")
            == insert_items.len()
    }

    pub fn query_locations(
        self,
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

    pub fn insert_location(self, location: Location) -> bool {
        use crate::schema::locations::dsl::*;

        diesel::insert_into(locations)
            .values(&location)
            .execute(&self.connection)
            .expect("Error inserting location.")
            == 1
    }

    pub fn insert_locations(self, insert_locations: Vec<Location>) -> bool {
        use crate::schema::locations::dsl::*;

        diesel::insert_into(locations)
            .values(&insert_locations)
            .execute(&self.connection)
            .expect("Error inserting locations.")
            == insert_locations.len()
    }

    pub fn query_characters(
        self,
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

    pub fn insert_character(self, character: Character) -> bool {
        use crate::schema::characters::dsl::*;

        diesel::insert_into(characters)
            .values(&character)
            .execute(&self.connection)
            .expect("Error inserting character.")
            == 1
    }

    pub fn insert_characters(self, insert_characters: Vec<Character>) -> bool {
        use crate::schema::characters::dsl::*;

        diesel::insert_into(characters)
            .values(&insert_characters)
            .execute(&self.connection)
            .expect("Error inserting characters.")
            == insert_characters.len()
    }

    pub fn query_dialogues(
        self,
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

    pub fn insert_dialogue(self, dialogue_text: Dialogue) -> bool {
        use crate::schema::dialogues::dsl::*;

        diesel::insert_into(dialogues)
            .values(&dialogue_text)
            .execute(&self.connection)
            .expect("Error inserting dialogue.")
            == 1
    }

    pub fn insert_dialogues(self, insert_dialogues: Vec<Dialogue>) -> bool {
        use crate::schema::dialogues::dsl::*;

        diesel::insert_into(dialogues)
            .values(&insert_dialogues)
            .execute(&self.connection)
            .expect("Error inserting dialogues.")
            == insert_dialogues.len()
    }
}
