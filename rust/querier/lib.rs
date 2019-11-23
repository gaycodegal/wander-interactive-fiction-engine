#[macro_use]
extern crate diesel;

pub mod models;
pub mod querier;
mod schema;

#[cfg(test)]
mod tests {
    use super::*;
    use std::env::current_exe;

    fn valid_db() -> models::Querier {
        return models::Querier::new("/home/gluax/docs/projects/wander-interactive-fiction-engine/test.db")
            .expect("Should always be a valid db.");
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
    fn db_connection_failure() {
        let querier = models::Querier::new("/home/gluax/docs/projects/wander-interactive-fiction-engine/dne.db");
        assert!(querier.is_none());
    }

    #[test]
    fn db_create_new_db() {
        let querier = models::Querier::new_file("/home/gluax/docs/projects/wander-interactive-fiction-engine/now_exists.db");
        assert!(!querier.is_none());
    }

    #[test]
    fn db_connection_success() {
        let querier = models::Querier::new("/home/gluax/docs/projects/wander-interactive-fiction-engine/test.db");
        assert!(querier.is_some());
    }

    #[test]
    fn test_query_items() {
        let querier = valid_db();
        let items = querier.query_items("apple", None, None);
        assert_eq!(2, items.len());
    }

    #[test]
    fn test_insert_item() {
        let querier = valid_db();
        let item = common_item();

        let inserted = querier.insert_item(item);
        assert!(inserted);
    }

    #[test]
    #[should_panic(
        expected = "Error inserting item.: DatabaseError(UniqueViolation, \"UNIQUE constraint failed: items.name\")"
    )]
    fn test_insert_existing_item() {
        let querier = valid_db();
        let item = common_item();

        let inserted = querier.insert_item(item);
        assert!(inserted);
    }
}
