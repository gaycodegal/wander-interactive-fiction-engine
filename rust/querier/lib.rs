extern crate serde;
extern crate serde_json;

#[macro_use]
extern crate diesel;
extern crate toml;

pub mod dialogue_tree;
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
            description: Some(String::from("Test item for testing.")),
            attributes: Some(String::from("test,debug,?")),
            components: Some(String::from("{'test': 'test'}")),
        }
    }

    fn common_location() -> models::Location {
        models::Location {
            name: String::from("Test_Location"),
            description: Some(String::from("Test location for testing.")),
            items: Some(String::from("Test_Item")),
            neighbors: Some(String::from(
                "{ \"south\": \"Test_South\", \"north\": \"Test_North\" }",
            )),
            characters: Some(String::from("Test_Character")),
        }
    }

    fn common_character() -> models::Character {
        models::Character {
            name: String::from("Test_Character"),
            components: Some(String::from("{ \"interactable\": true }")),
        }
    }

    fn common_dialogue() -> models::Dialogue {
        models::Dialogue {
            id: 100,
            characters: String::from("dad,mom,sister"),
            flags: Some(String::from("apple_acquired,brother_dead")),
            location: String::from("kitchen"),
            dialogue: String::from("hello i am dialogue."),
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

        let items = querier.query_items(Some("apple"), None, None);
        assert_eq!(3, items.len());
    }

    #[test]
    fn test_attr_query_items() {
        let querier = new_valid_db("attr_query_items.db");

        let attrs = vec!["red"];
        let items = querier.query_items(None, Some(attrs), None);
        assert_eq!(2, items.len());

        let attrs = vec!["fairy", "poisoned"];
        let items = querier.query_items(None, Some(attrs), None);
        assert_eq!(1, items.len());
    }

    #[test]
    fn test_comp_query_items() {
        let querier = new_valid_db("comp_query_items.db");

        let comps = vec!["damages"];
        let items = querier.query_items(None, None, Some(comps));
        assert_eq!(3, items.len());

        let comps = vec!["heals", "interactable"];
        let items = querier.query_items(None, None, Some(comps));
        assert_eq!(2, items.len());
    }

    #[test]
    fn test_query_all_items() {
        let querier = new_valid_db("query_all_items.db");

        let items = querier.query_items(None, None, None);
        assert_eq!(6, items.len());
    }

    #[test]
    fn test_insert_item() {
        let querier = new_valid_db("insert_item.db");
        let item = models::Item {
            name: String::from("Test_Item_Insert"),
            description: Some(String::from("Test item for insert testing.")),
            attributes: Some(String::from("test,debug,insert")),
            components: Some(String::from("{'test': 'test'}")),
        };

        let inserted = querier.insert_item(item.clone());
        assert_eq!(1, inserted);

        let got_item = querier.get_item("Test_Item_Insert");
        assert_eq!(item, got_item);
    }

    #[test]
    fn test_insert_items() {
        let querier = new_valid_db("insert_items.db");
        let mut items = Vec::new();

        items.push(models::Item {
            name: String::from("Test_Item_Insert_1"),
            description: Some(String::from("Test item for insert testing.")),
            attributes: Some(String::from("test,debug,insert")),
            components: Some(String::from("{'test': 'test'}")),
        });

        items.push(models::Item {
            name: String::from("Test_Item_Insert_2"),
            description: Some(String::from("Test item for insert testing.")),
            attributes: Some(String::from("test,debug,insert")),
            components: Some(String::from("{'test': 'test'}")),
        });

        let inserted = querier.insert_items(items.clone());
        assert_eq!(2, inserted);

        let q_items = querier.query_items(Some("Test_Item_Insert"), None, None);
        assert_eq!(items[0], q_items[0]);
        assert_eq!(items[1], q_items[1]);
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
        assert_eq!(common_item(), got_item);
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
    fn test_simple_update_item() {
        let querier = new_valid_db("simple_update_item.db");
        let mut item = common_item();
        item.description = Some(String::from("updated description."));

        assert_eq!(1, querier.update_item("Test_Item", item.clone()));

        let got_item = querier.get_item("Test_Item");
        assert_eq!(item.clone(), got_item);
    }

    #[test]
    fn test_complex_update_item() {
        let querier = new_valid_db("complex_update_item.db");
        let mut item = common_item();
        item.name = String::from("Updated_Item_Name");
        item.description = Some(String::from("updated description."));
        item.attributes = Some(String::from("updates,test"));
        item.components = Some(String::from("{\"updated\": true}"));

        assert_eq!(1, querier.update_item("Test_Item", item.clone()));

        let got_item = querier.get_item("Updated_Item_Name");
        assert_eq!(item.clone(), got_item);
    }

    #[test]
    fn test_basic_query_locations() {
        let querier = new_valid_db("query_locations.db");

        let locations = querier.query_locations(Some("kitchen"), None, None);
        assert_eq!(2, locations.len());
    }

    #[test]
    fn test_item_query_locations() {
        let querier = new_valid_db("item_query_locations.db");

        let items = vec!["apple_json"];
        let locations = querier.query_locations(None, Some(items), None);
        assert_eq!(1, locations.len());

        let items = vec!["fairy", "Blob"];
        let locations = querier.query_locations(None, Some(items), None);
        assert_eq!(1, locations.len());
    }

    #[test]
    fn test_chara_query_locations() {
        let querier = new_valid_db("chara_query_locations.db");

        let charas = vec!["Bird"];
        let locations = querier.query_locations(None, None, Some(charas));
        assert_eq!(1, locations.len());

        let charas = vec!["mother", "sister"];
        let locations = querier.query_locations(None, None, Some(charas));
        assert_eq!(1, locations.len());
    }

    #[test]
    fn test_query_all_locations() {
        let querier = new_valid_db("query_all_locations.db");

        let locations = querier.query_locations(None, None, None);
        assert_eq!(6, locations.len());
    }

    #[test]
    fn test_insert_location() {
        let querier = new_valid_db("insert_location.db");

        let inserted = querier.insert_location(models::Location {
            name: String::from("Test_Location_Insert"),
            description: Some(String::from(
                "Test location for insert testing.",
            )),
            items: Some(String::from("random string")),
            neighbors: Some(String::from("vitae")),
            characters: Some(String::from("umbra")),
        });
        assert_eq!(1, inserted);
    }

    #[test]
    fn test_insert_locations() {
        let querier = new_valid_db("insert_locations.db");
        let mut locations = Vec::new();

        locations.push(models::Location {
            name: String::from("Test_Location_Insert_1"),
            description: Some(String::from(
                "Test location for insert testing.",
            )),
            items: Some(String::from("random string")),
            neighbors: Some(String::from("vitae")),
            characters: Some(String::from("umbra")),
        });

        locations.push(models::Location {
            name: String::from("Test_Location_Insert_2"),
            description: Some(String::from(
                "Test location for insert testing.",
            )),
            items: Some(String::from("random string")),
            neighbors: Some(String::from("vitae")),
            characters: Some(String::from("umbra")),
        });

        let inserted = querier.insert_locations(locations.clone());
        assert_eq!(2, inserted);

        let q_locations =
            querier.query_locations(Some("Test_Location_Insert"), None, None);
        assert_eq!(locations[0], q_locations[0]);
        assert_eq!(locations[1], q_locations[1]);
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
    fn test_simple_update_location() {
        let querier = new_valid_db("simple_update_location.db");
        let mut location = common_location();
        location.description = Some(String::from("updated description."));

        assert_eq!(
            1,
            querier.update_location("Test_Location", location.clone())
        );

        let got_location = querier.get_location("Test_Location");
        assert_eq!(location.clone(), got_location);
    }

    #[test]
    fn test_complex_update_location() {
        let querier = new_valid_db("complex_update_location.db");
        let mut location = common_location();
        location.name = String::from("Updated_Location_Name");
        location.description = Some(String::from("updated description."));
        location.items = Some(String::from("apple_toml"));
        location.neighbors = Some(String::from("{\"updated\": true}"));
        location.characters = Some(String::from("dad"));

        assert_eq!(
            1,
            querier.update_location("Test_Location", location.clone())
        );

        let got_location = querier.get_location("Updated_Location_Name");
        assert_eq!(location.clone(), got_location);
    }

    #[test]
    fn test_basic_query_characters() {
        let querier = new_valid_db("query_characters.db");

        let characters = querier.query_characters(Some("dad"), None);
        assert_eq!(2, characters.len());
    }

    #[test]
    fn test_comp_query_characters() {
        let querier = new_valid_db("comp_query_characters.db");

        let comps = vec!["interactable"];
        let locations = querier.query_characters(None, Some(comps));
        assert_eq!(5, locations.len());

        let comps = vec!["interactable", "killable"];
        let locations = querier.query_characters(None, Some(comps));
        assert_eq!(1, locations.len());
    }

    #[test]
    fn test_query_all_characters() {
        let querier = new_valid_db("query_characters.db");

        let characters = querier.query_characters(None, None);
        assert_eq!(5, characters.len());
    }

    #[test]
    fn test_insert_character() {
        let querier = new_valid_db("insert_character.db");

        let inserted = querier.insert_character(models::Character {
            name: String::from("Test_Character_Insert"),
            components: Some(String::from("{ \"interactable\": true }")),
        });
        assert_eq!(1, inserted);
    }

    #[test]
    fn test_insert_characters() {
        let querier = new_valid_db("insert_characters.db");
        let mut characters = Vec::new();

        characters.push(models::Character {
            name: String::from("Test_Character_Insert_1"),
            components: Some(String::from("{ \"interactable\": true }")),
        });

        characters.push(models::Character {
            name: String::from("Test_Character_Insert_2"),
            components: Some(String::from("{ \"interactable\": true }")),
        });

        let inserted = querier.insert_characters(characters.clone());
        assert_eq!(2, inserted);

        let q_characters =
            querier.query_characters(Some("Test_Character_Insert"), None);
        assert_eq!(characters[0], q_characters[0]);
        assert_eq!(characters[1], q_characters[1]);
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

    #[test]
    fn test_simple_update_character() {
        let querier = new_valid_db("simple_update_character.db");
        let mut character = common_character();
        character.components = Some(String::from("{\"updated\": true}"));

        assert_eq!(
            1,
            querier.update_character("Test_Character", character.clone())
        );

        let got_character = querier.get_character("Test_Character");
        assert_eq!(character.clone(), got_character);
    }

    #[test]
    fn test_complex_update_character() {
        let querier = new_valid_db("complex_update_character.db");
        let mut character = common_character();
        character.name = String::from("Updated_Character_Name");
        character.components = Some(String::from("{\"updated\": true}"));

        assert_eq!(
            1,
            querier.update_character("Test_Character", character.clone())
        );

        let got_character = querier.get_character("Updated_Character_Name");
        assert_eq!(character.clone(), got_character);
    }

    #[test]
    fn test_basic_query_dialogues() {
        let querier = new_valid_db("query_dialogues.db");

        let characters = vec!["dad"];
        let dialogues =
            querier.query_dialogues(Some(characters), None, None, None);
        assert_eq!(2, dialogues.len());
    }

    #[test]
    fn test_flags_query_dialogues() {
        let querier = new_valid_db("flag_query_dialogues.db");

        let flags = vec!["grounded"];
        let dialogues = querier.query_dialogues(None, Some(flags), None, None);
        assert_eq!(2, dialogues.len());

        let flags = vec!["fairy", "poisoned"];
        let dialogues = querier.query_dialogues(None, Some(flags), None, None);
        assert_eq!(1, dialogues.len());
    }

    #[test]
    fn test_loc_query_dialogues() {
        let querier = new_valid_db("comp_query_dialogues.db");

        let dialogues =
            querier.query_dialogues(None, None, Some("kitchen"), None);
        assert_eq!(2, dialogues.len());
    }

    #[test]
    fn test_snip_query_dialogues() {
        let querier = new_valid_db("snip_query_dialogues.db");

        let snips = vec!["I wanna die"];
        let dialogues = querier.query_dialogues(None, None, None, Some(snips));
        assert_eq!(2, dialogues.len());

        let snips = vec!["I wanna die", "Me too thanks"];
        let dialogues = querier.query_dialogues(None, None, None, Some(snips));
        assert_eq!(1, dialogues.len());
    }

    #[test]
    fn test_query_all_dialogues() {
        let querier = new_valid_db("query_all_dialogues.db");

        let dialogues = querier.query_dialogues(None, None, None, None);
        assert_eq!(6, dialogues.len());
    }

    #[test]
    fn test_insert_dialogue() {
        let querier = new_valid_db("insert_dialogue.db");
        let dialogue = models::Dialogue {
            id: 50,
            characters: String::from("dad,fairy,blob"),
            flags: None,
            location: String::from("backyard"),
            dialogue: String::from("Hello! I am Blob."),
        };

        let inserted = querier.insert_dialogue(dialogue.clone());
        assert_eq!(1, inserted);

        let got_dialogue = querier.get_dialogue(50);
        assert_eq!(dialogue, got_dialogue);
    }

    #[test]
    fn test_insert_dialogues() {
        let querier = new_valid_db("insert_dialogues.db");
        let mut dialogues = Vec::new();

        dialogues.push(models::Dialogue {
            id: 50,
            characters: String::from("dad,fairy,blob"),
            flags: None,
            location: String::from("backyard"),
            dialogue: String::from("Hello! I am Blob."),
        });

        dialogues.push(models::Dialogue {
            id: 51,
            characters: String::from("sister,mom,blob"),
            flags: None,
            location: String::from("living_room"),
            dialogue: String::from("Pew pew pew."),
        });

        let inserted = querier.insert_dialogues(dialogues.clone());
        assert_eq!(2, inserted);

        let characters = vec!["blob"];
        let q_dialogues =
            querier.query_dialogues(Some(characters), None, None, None);
        assert_eq!(dialogues[0], q_dialogues[0]);
        assert_eq!(dialogues[1], q_dialogues[1]);
    }

    #[test]
    #[should_panic(
        expected = "Error inserting dialogue.: DatabaseError(UniqueViolation, \"UNIQUE constraint failed: dialogues.id\")"
    )]
    fn test_insert_existing_dialogue() {
        let querier = new_valid_db("insert_existing_dialogue.db");

        querier.insert_dialogue(common_dialogue());
    }

    #[test]
    fn test_get_dialogue() {
        let querier = new_valid_db("get_dialogue.db");

        let got_dialogue = querier.get_dialogue(100);
        assert_eq!(common_dialogue(), got_dialogue);
    }

    #[test]
    #[should_panic(expected = "Failed to get dialogue.: NotFound")]
    fn test_get_nonexistant_dialogue() {
        let querier = new_valid_db("get_nonexistant_dialogue.db");

        querier.get_dialogue(1000);
    }

    #[test]
    fn test_remove_dialogue() {
        let querier = new_valid_db("remove_dialogue.db");

        assert_eq!(1, querier.remove_dialogue(100));
    }

    #[test]
    fn test_simple_update_dialogue() {
        let querier = new_valid_db("simple_update_dialogue.db");
        let mut dialogue = common_dialogue();
        dialogue.dialogue = String::from("updated dialogue.");

        assert_eq!(1, querier.update_dialogue(100, dialogue.clone()));

        let got_dialogue = querier.get_dialogue(100);
        assert_eq!(dialogue.clone(), got_dialogue);
    }

    #[test]
    fn test_complex_update_dialogue() {
        let querier = new_valid_db("complex_update_dialogue.db");
        let mut dialogue = common_dialogue();
        dialogue.characters = String::from("mom,dad");
        dialogue.flags = Some(String::from("hw"));
        dialogue.location = String::from("Test_Location");
        dialogue.dialogue = String::from("Mama mia.");

        assert_eq!(1, querier.update_dialogue(100, dialogue.clone()));

        let got_dialogue = querier.get_dialogue(100);
        assert_eq!(dialogue.clone(), got_dialogue);
    }
}
