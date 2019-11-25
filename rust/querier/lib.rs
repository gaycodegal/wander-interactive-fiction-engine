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
    use std::fs::remove_file;
    use std::path::PathBuf;

    fn valid_db(db_name: &str) -> models::Querier {
        let mut path = PathBuf::from("/tmp");
        path.push(db_name);

        remove_file(&path);

        let querier = models::Querier::new_file(
            &path
                .into_os_string()
                .into_string()
                .expect("created path succesfully"),
        )
        .expect("Failed to create valid db.");

        querier.setup_db();

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

    #[test]
    fn db_create_new_db() {
        let mut path = PathBuf::from("/tmp");
        path.push("new_db.db");

        let querier = models::Querier::new_file(
            &path
                .into_os_string()
                .into_string()
                .expect("created path succesfully"),
        );

        assert!(!querier.is_none());
    }

    #[test]
    fn test_query_items() {
        let querier = valid_db("query_items.db");
        let items = querier.query_items("apple", None, None);
        assert_eq!(2, items.len());
    }

    #[test]
    fn test_insert_item() {
        let querier = valid_db("insert_item.db");

        let inserted = querier.insert_item(common_item());
        assert!(inserted);
    }

    #[test]
    #[should_panic(
        expected = "Error inserting item.: DatabaseError(UniqueViolation, \"UNIQUE constraint failed: items.name\")"
    )]
    fn test_insert_existing_item() {
        let querier = valid_db("insert_existing_item.db");

        querier.insert_item(common_item());
        let inserted = querier.insert_item(common_item());
        assert!(inserted);
    }
}
