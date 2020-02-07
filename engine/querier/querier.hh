#pragma once

#include <optional>
#include <vector>

#include "models.hh"
#include "sqlite_orm.hh"

static auto initStorage(const std::string &path) {
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

class Querier {
 public:
  Querier(const std::string &path);

  std::vector<models::Item> query_items(
      std::optional<std::string> name,
      std::optional<std::vector<std::string>> attributes,
      std::optional<std::vector<std::string>> components);
  inline models::Item get_item(std::string name);
  inline auto insert_item(models::Item item);
  auto insert_items(std::vector<models::Item> items);
  inline auto remove_item(std::string name);
  inline auto update_item(models::Item updated_item);

  inline models::Location get_location(std::string name);
  inline auto insert_location(models::Location location);
  auto insert_locations(std::vector<models::Location> locations);
  inline auto remove_location(std::string name);
  inline auto update_location(models::Location updated_location);

  inline models::Character get_character(std::string name);
  inline auto insert_character(models::Character character);
  auto insert_characters(std::vector<models::Character> characters);
  inline auto remove_character(std::string name);
  inline auto update_character(models::Character updated_character);

  inline models::Dialogue get_dialogue(std::string name);
  inline auto insert_dialogue(models::Dialogue dialogue);
  auto insert_dialogues(std::vector<models::Dialogue> dialogues);
  inline auto remove_dialogue(std::string name);
  inline auto update_dialogue(models::Dialogue updated_dialogue);

  inline models::Node get_node(std::string name);
  inline auto insert_node(models::Node node);
  auto insert_nodes(std::vector<models::Node> nodes);
  inline auto remove_node(std::string name);
  inline auto update_node(models::Node updated_node);

 private:
  std::unique_ptr<Storage> m_storage;
};