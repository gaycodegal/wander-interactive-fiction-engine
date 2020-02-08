#include "models.hh"
#include "sqlite_orm.hh"

inline auto initStorage(const std::string& path) {
  return sqlite_orm::make_storage(
      path,
      sqlite_orm::make_table(
          "patterns",
          sqlite_orm::make_column("pattern", &models::Pattern::value)),

      sqlite_orm::make_index("item_names", &models::Item::name),
      sqlite_orm::make_table(
          "items",
          sqlite_orm::make_column("name", &models::Item::name,
                                  sqlite_orm::primary_key()),
          sqlite_orm::make_column("description", &models::Item::description),
          sqlite_orm::make_column("attributes", &models::Item::attributes),
          sqlite_orm::make_column("components", &models::Item::components)),

      sqlite_orm::make_index("location_names", &models::Location::name),
      sqlite_orm::make_table(
          "locations",
          sqlite_orm::make_column("name", &models::Location::name,
                                  sqlite_orm::primary_key()),
          sqlite_orm::make_column("description",
                                  &models::Location::description),
          sqlite_orm::make_column("neighbors", &models::Location::neighbors),
          sqlite_orm::make_column("characters", &models::Location::characters),
          sqlite_orm::make_column("items", &models::Location::getItems,
                                  &models::Location::setItems)),

      sqlite_orm::make_index("character_names", &models::Character::name),
      sqlite_orm::make_table(
          "characters",
          sqlite_orm::make_column("name", &models::Character::name,
                                  sqlite_orm::primary_key()),
          sqlite_orm::make_column("components",
                                  &models::Character::components)),

      sqlite_orm::make_index("dialogue_id", &models::Dialogue::id),
      sqlite_orm::make_table(
          "dialogues",
          sqlite_orm::make_column("id", &models::Dialogue::id,
                                  sqlite_orm::autoincrement(),
                                  sqlite_orm::primary_key()),
          sqlite_orm::make_column("characters", &models::Dialogue::characters),
          sqlite_orm::make_column("flags", &models::Dialogue::flags),
          sqlite_orm::make_column("location", &models::Dialogue::location),
          sqlite_orm::make_column("priority", &models::Dialogue::priority),
          sqlite_orm::make_column("dialogue", &models::Dialogue::getDialogue,
                                  &models::Dialogue::setDialogue)),

      sqlite_orm::make_index("node_id", &models::Node::id),
      sqlite_orm::make_table(
          "nodes",
          sqlite_orm::make_column("id", &models::Node::id,
                                  sqlite_orm::autoincrement(),
                                  sqlite_orm::primary_key()),
          sqlite_orm::make_column("dialogue", &models::Node::getDialogue,
                                  &models::Node::setDialogue)));
}
using Storage = decltype(initStorage(""));
