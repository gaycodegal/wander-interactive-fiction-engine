#pragma once

#include <filesystem>
#include <optional>
#include <vector>

#include "qtypes.cc"

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