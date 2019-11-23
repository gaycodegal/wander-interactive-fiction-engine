use crate::schema::*;
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
pub struct Querier {
    pub connection: SqliteConnection,
}

#[derive(Insertable, Queryable, Debug, PartialEq)]
#[table_name = "items"]
pub struct Item {
    pub name: String,
    pub description: String,
    pub attributes: String,
    pub components: String,
}

impl Item {
    pub fn new(
        name: String,
        description: String,
        attributes: String,
        components: String,
    ) -> Item {
        Item {
            name,
            description,
            attributes,
            components,
        }
    }
}

#[derive(Insertable, Queryable, Debug)]
#[table_name = "locations"]
pub struct Location {
    pub name: String,
    pub description: String,
    pub items: String,
    pub neighbors: String,
    pub characters: String,
}

impl Location {
    pub fn new(
        name: String,
        description: String,
        items: String,
        neighbors: String,
        characters: String,
    ) -> Location {
        Location {
            name,
            description,
            items,
            neighbors,
            characters,
        }
    }

    pub fn items(self, querier: Querier) -> Vec<Item> {
        use crate::schema::items::dsl::*;
        let connection = querier.connection;
        let mut items_in_room: Vec<Item> = Vec::new();

        for item in self.items.split(",") {
            if !item.is_empty() {
                items_in_room.push(
                    items
                        .find(item)
                        .first(&connection)
                        .expect("Could not look up item."),
                );
            }
        }

        items_in_room
    }

    pub fn dialogues(self, querier: Querier) -> Vec<Dialogue> {
        use crate::schema::dialogues::dsl::*;
        let connection = querier.connection;

        dialogues
            .filter(location.like(format!("%{}%", self.name)))
            .load::<Dialogue>(&connection)
            .expect("Could not look up dialogues.")
    }
}

#[derive(Insertable, Queryable, Debug)]
#[table_name = "characters"]
pub struct Character {
    pub name: String,
    pub components: String,
}

impl Character {
    pub fn new(name: String, components: String) -> Character {
        Character { name, components }
    }
    pub fn dialogues(self, querier: Querier) -> Vec<Dialogue> {
        use crate::schema::dialogues::dsl::*;
        let connection = querier.connection;

        dialogues
            .filter(characters.like(format!("%{}%", self.name)))
            .load::<Dialogue>(&connection)
            .expect("Could not look up dialogues.")
    }
}

#[derive(Insertable, Queryable, Debug)]
#[table_name = "dialogues"]
pub struct Dialogue {
    pub characters: String,
    pub flags: String,
    pub location: String,
    pub dialogue: String,
}

impl Dialogue {
    pub fn new(
        characters: String,
        flags: String,
        location: String,
        dialogue: String,
    ) -> Dialogue {
        Dialogue {
            characters,
            flags,
            location,
            dialogue,
        }
    }
}
