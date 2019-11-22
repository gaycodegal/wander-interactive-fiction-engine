use diesel::sqlite::SqliteConnection;

pub struct Querier<'a> {
    pub connection: SqliteConnection,
    pub database_url: &'a str,
}

#[derive(Queryable)]
pub struct Item {
    pub name: String,
    pub description: String,
    pub attributes: String,
    pub components: String,
}

#[derive(Queryable)]
pub struct Location {
    pub name: String,
    pub description: String,
    pub items: String,
    pub neighbors: String,
    pub characters: String,
}

impl Location {
    fn items(self, querier: Querier) -> Vec<Item> {
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

    fn dialogues(self, querier: Querier) -> Vec<Dialogue> {
        use crate::schema::dialogues::dsl::*;
        let connection = querier.connection;

        dialogues
            .filter(location.like(format!("%{}%", self.name)))
            .load::<Dialogue>(&connection)
            .expect("Could not look up dialogues.")
    }
}

#[derive(Queryable)]
pub struct Character {
    pub name: String,
    pub components: String,
}

impl Character {
    fn dialogues(self, querier: Querier) -> Vec<Dialogue> {
        use crate::schema::dialogues::dsl::*;
        let connection = querier.connection;

        dialogues
            .filter(character_name.like(format!("%{}%", self.name)))
            .load::<Dialogue>(&connection)
            .expect("Could not look up dialogues.")
    }
}

#[derive(Queryable)]
pub struct Dialogue {
    pub character: String,
    pub flags: String,
    pub location: String,
    pub dialogue: String,
}
