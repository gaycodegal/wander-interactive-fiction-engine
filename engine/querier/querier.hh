#pragma once

#include <filesystem>
#include <optional>
#include <vector>

#include "models.hh"
#include "sqlite_orm.hh"

static inline auto initStorage(const std::string& path) {
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

struct File {
  std::optional<std::vector<models::Item>> items;
  std::optional<std::vector<models::Location>> locations;
  std::optional<std::vector<models::Character>> characters;
  std::optional<std::vector<models::Dialogue>> dialogues;
  std::optional<std::vector<models::Node>> nodes;
};

void to_json(json& j, const File& file);
void from_json(const json& j, File& file);

class Querier {
 public:
  Querier(const std::filesystem::path& path);

#ifdef TESTING
  void dump_from_file(const std::filesystem::path& path);
#endif

  std::vector<models::Item> query_items(
      std::optional<std::string> name,
      std::optional<std::vector<std::string>> attributes,
      std::optional<std::vector<std::string>> components);
  inline models::Item get_item(std::string name);
  inline void insert_item(models::Item item);
  auto insert_items(std::vector<models::Item> items);
  inline void remove_item(std::string name);
  inline void update_item(models::Item updated_item);

  inline models::Location get_location(std::string name);
  inline void insert_location(models::Location location);
  auto insert_locations(std::vector<models::Location> locations);
  inline void remove_location(std::string name);
  inline void update_location(models::Location updated_location);

  inline models::Character get_character(std::string name);
  inline void insert_character(models::Character character);
  auto insert_characters(std::vector<models::Character> characters);
  inline void remove_character(std::string name);
  inline void update_character(models::Character updated_character);

  inline models::Dialogue get_dialogue(std::string name);
  inline void insert_dialogue(models::Dialogue dialogue);
  auto insert_dialogues(std::vector<models::Dialogue> dialogues);
  inline void remove_dialogue(std::string name);
  inline void update_dialogue(models::Dialogue updated_dialogue);

  inline models::Node get_node(std::string name);
  inline void insert_node(models::Node node);
  auto insert_nodes(std::vector<models::Node> nodes);
  inline void remove_node(std::string name);
  inline void update_node(models::Node updated_node);

 private:
  std::unique_ptr<Storage> m_storage;
};