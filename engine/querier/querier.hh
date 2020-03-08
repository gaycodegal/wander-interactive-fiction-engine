#pragma once

#include <filesystem>

#include "models.hh"
#include "sqlite_orm.hh"

static inline auto initStorage(const Str& path) {
  return sqlite_orm::make_storage(
      path,
      sqlite_orm::make_table(
          "patterns_one",
          sqlite_orm::make_column("pattern", &models::PatternOne::value)),

      sqlite_orm::make_table(
          "patterns_two",
          sqlite_orm::make_column("pattern", &models::PatternTwo::value)),

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
  Querier(const std::filesystem::path& path);

  Vec<models::Item> query_items(Opt<Str> name, Opt<Vec<Str>> attributes,
                                Opt<Vec<Str>> components);
  models::Item get_item(Str name);
  void insert_item(models::Item item);
  auto insert_items(Vec<models::Item> items);
  void remove_item(Str name);
  void update_item(models::Item updated_item);

  Vec<models::Location> query_locations(Opt<Str> name, Opt<Vec<Str>> items,
                                        Opt<Vec<Str>> characters);
  inline models::Location get_location(Str name);
  inline void insert_location(models::Location location);
  auto insert_locations(Vec<models::Location> locations);
  inline void remove_location(Str name);
  inline void update_location(models::Location updated_location);
  inline Vec<models::Dialogue> get_location_dialogues(
      models::Location location);
  Vec<models::Item> get_location_items(models::Location location);

  Vec<models::Character> query_characters(Opt<Str> name,
                                          Opt<Vec<Str>> components);
  inline models::Character get_character(Str name);
  inline void insert_character(models::Character character);
  auto insert_characters(Vec<models::Character> characters);
  inline void remove_character(Str name);
  inline void update_character(models::Character updated_character);
  inline Vec<models::Dialogue> get_character_dialogues(
      models::Character character);

  Vec<models::Dialogue> query_dialogues(Opt<Str> text, Opt<Vec<Str>> characters,
                                        Opt<Vec<Str>> flags,
                                        Opt<Vec<Str>> locations);
  inline models::Dialogue get_dialogue(Str name);
  inline void insert_dialogue(models::Dialogue dialogue);
  auto insert_dialogues(Vec<models::Dialogue> dialogues);
  inline void remove_dialogue(Str name);
  inline void update_dialogue(models::Dialogue updated_dialogue);

  Vec<models::Node> query_dialogues(Opt<Str> text);
  inline models::Node get_node(Str name);
  inline void insert_node(models::Node node);
  auto insert_nodes(Vec<models::Node> nodes);
  inline void remove_node(Str name);
  inline void update_node(models::Node updated_node);

#ifdef TESTING
  void dump_from_file(const std::filesystem::path& path);
#endif
 private:
  std::unique_ptr<Storage> m_storage;
};