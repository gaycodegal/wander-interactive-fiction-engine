extern crate serde;
extern crate serde_json;

#[macro_use]
extern crate diesel;
extern crate toml;

pub mod models;
pub mod querier;
mod schema;

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn get_file_path(file_name: &str) -> String {
        let mut path = PathBuf::from("test.runfiles/wander_interactive_fiction_engine/rust/querier/testdata");
        path.push(file_name);

        path.into_os_string()
            .into_string()
            .expect("String conversion of path failed.")
    }

    fn new_valid_db(db_name: &str) -> models::Querier {
        let querier = models::Querier::new_file(&get_file_path(db_name))
            .expect("Failed to create valid db.");

        querier.setup_db();

        querier
            .dump_from_file(
                &get_file_path("test_dump_json.json"),
                models::FileType::JSON,
            )
            .expect("unsuccesful json dump to db");
        querier
            .dump_from_file(
                &get_file_path("test_dump_toml.toml"),
                models::FileType::TOML,
            )
            .expect("unsuccesful toml dump to db");

        querier
    }

    fn common_item() -> models::Item {
        models::Item {
            name: String::from("Test_Item"),
            description: String::from("Test item for testing."),
            attributes: String::from("test,debug,?"),
            components: String::from("{'test': 'test'}"),
        }
    }

    fn common_location() -> models::Location {
        models::Location {
            name: String::from("Test_Location"),
            description: String::from("Test location for testing."),
            items: String::from("Test_Item"),
            neighbors: String::from(
                "{ \"south\": \"Test_South\", \"north\": \"Test_North\" }",
            ),
            characters: String::from("Test_Character"),
        }
    }

    fn common_character() -> models::Character {
        models::Character {
            name: String::from("Test_Character"),
            components: String::from("{ \"interactable\": true }"),
        }
    }

    #[test]
    fn db_create_new_db() {
        let querier = models::Querier::new_file("new_db.db");

        assert!(!querier.is_none());
    }

    #[test]
    fn test_basic_query_items() {
        let querier = new_valid_db("query_items.db");

        let items = querier.query_items("apple", None, None);
        assert_eq!(2, items.len());
    }

    #[test]
    fn test_insert_item() {
        let querier = new_valid_db("insert_item.db");

        let inserted = querier.insert_item(models::Item {
            name: String::from("Test_Item_Insert"),
            description: String::from("Test item for insert testing."),
            attributes: String::from("test,debug,insert"),
            components: String::from("{'test': 'test'}"),
        });
        assert_eq!(1, inserted);
    }

    #[test]
    #[should_panic(
        expected = "Error inserting item.: DatabaseError(UniqueViolation, \"UNIQUE constraint failed: items.name\")"
    )]
    fn test_insert_existing_item() {
        let querier = new_valid_db("insert_existing_item.db");

        querier.insert_item(common_item());
    }

    #[test]
    fn test_get_item() {
        let querier = new_valid_db("get_item.db");

        let got_item = querier.get_item("Test_Item");
        assert_eq!(got_item, common_item());
    }

    #[test]
    #[should_panic(expected = "Failed to get item.: NotFound")]
    fn test_get_nonexistant_item() {
        let querier = new_valid_db("get_nonexistant_item.db");

        querier.get_item("Fake_Item");
    }

    #[test]
    fn test_remove_item() {
        let querier = new_valid_db("remove_item.db");

        assert_eq!(1, querier.remove_item("Test_Item"));
    }

    #[test]
    fn test_basic_query_locations() {
        let querier = new_valid_db("query_locations.db");

        let locations = querier.query_locations("kitchen", None, None);
        assert_eq!(2, locations.len());
    }

    #[test]
    fn test_insert_location() {
        let querier = new_valid_db("insert_location.db");

        let inserted = querier.insert_location(models::Location {
            name: String::from("Test_Location_Insert"),
            description: String::from("Test location for insert testing."),
            items: String::from("random string"),
            neighbors: String::from("vitae"),
            characters: String::from("umbra"),
        });
        assert_eq!(1, inserted);
    }

    #[test]
    #[should_panic(
        expected = "Error inserting location.: DatabaseError(UniqueViolation, \"UNIQUE constraint failed: locations.name\")"
    )]
    fn test_insert_existing_location() {
        let querier = new_valid_db("insert_existing_location.db");

        querier.insert_location(common_location());
    }

    #[test]
    fn test_get_location() {
        let querier = new_valid_db("get_location.db");

        let got_location = querier.get_location("Test_Location");
        assert_eq!(got_location, common_location());
    }

    #[test]
    #[should_panic(expected = "Failed to get location.: NotFound")]
    fn test_get_nonexistant_location() {
        let querier = new_valid_db("get_nonexistant_location.db");

        querier.get_location("Fake_Location");
    }

    #[test]
    fn test_remove_location() {
        let querier = new_valid_db("remove_location.db");

        assert_eq!(1, querier.remove_location("Test_Location"));
    }

    #[test]
    fn test_basic_query_characters() {
        let querier = new_valid_db("query_characters.db");

        let characters = querier.query_characters("dad", None);
        assert_eq!(2, characters.len());
    }

    #[test]
    fn test_insert_character() {
        let querier = new_valid_db("insert_character.db");

        let inserted = querier.insert_character(models::Character {
            name: String::from("Test_Character_Insert"),
            components: String::from("{ \"interactable\": true }"),
        });
        assert_eq!(1, inserted);
    }

    #[test]
    #[should_panic(
        expected = "Error inserting character.: DatabaseError(UniqueViolation, \"UNIQUE constraint failed: characters.name\")"
    )]
    fn test_insert_existing_character() {
        let querier = new_valid_db("insert_existing_character.db");

        querier.insert_character(common_character());
    }

    #[test]
    fn test_get_character() {
        let querier = new_valid_db("get_character.db");

        let got_character = querier.get_character("Test_Character");
        assert_eq!(got_character, common_character());
    }

    #[test]
    #[should_panic(expected = "Failed to get character.: NotFound")]
    fn test_get_nonexistant_character() {
        let querier = new_valid_db("get_nonexistant_character.db");

        querier.get_character("Fake_Character");
    }

    #[test]
    fn test_remove_character() {
        let querier = new_valid_db("remove_character.db");

        assert_eq!(1, querier.remove_character("Test_Character"));
    }
}
