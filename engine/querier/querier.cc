#include "querier.hh"

using namespace sqlite_orm;

void to_json(json &j, const File &file) {
  j = json{
      {"items", file.items},           {"locations", file.locations},
      {"characters", file.characters}, {"dialogues", file.dialogues},
      {"nodes", file.nodes},
  };
}

void from_json(const json &j, File &file) {
  j.at("items").get_to(file.items);
  j.at("locations").get_to(file.locations);
  j.at("characters").get_to(file.characters);
  j.at("dialogues").get_to(file.dialogues);
  j.at("nodes").get_to(file.nodes);
}

Querier::Querier(const std::filesystem::path &path) {
  this->m_storage = std::make_unique<Storage>(initStorage(path));
  if (!std::filesystem::exists(path)) this->m_storage->sync_schema();
}

std::vector<models::Item> Querier::query_items(
    std::optional<std::string> name,
    std::optional<std::vector<std::string>> attributes,
    std::optional<std::vector<std::string>> components) {
  if (!name && !attributes && !components)
    return this->m_storage->get_all<models::Item>();

  if (name) {
    return this->m_storage->get_all<models::Item>(
        where(like(&models::Item::name, "%" + name.value() + "%")));
  }

  std::vector<models::Item> items;
  this->m_storage->begin_transaction();

  if (attributes) {
    for (const auto &attr : attributes.value()) {
      models::Pattern p = {attr};
      this->m_storage->insert(p);
      // std::cout << attr << std::endl;
    }
  }

  /* return this->m_storage->get_all<models::Item>(
                where(in(&models::Item::name, select(
                        &models::Item::name,
     where(like(&models::Item::attributes, &models::Pattern::value)))))
        ); */

  /* if (components) {
    for (const auto &comp : components.value()) {
      std::cout << comp << std::endl;
    }
  } */

  this->m_storage->rollback();

  return items;
}

inline models::Item Querier::get_item(std::string name) {
  return this->m_storage->get<models::Item>(name);
}

inline void Querier::insert_item(models::Item item) {
  this->m_storage->replace(item);
}

auto Querier::insert_items(std::vector<models::Item> items) {
  return this->m_storage->transaction([&] {
    for (const auto &item : items) {
      this->m_storage->replace(item);
    }
    return true;
  });
}

inline void Querier::remove_item(std::string name) {
  this->m_storage->remove<models::Item>(name);
}

inline void Querier::update_item(models::Item updated_item) {
  this->m_storage->update(updated_item);
}

inline models::Location Querier::get_location(std::string name) {
  return this->m_storage->get<models::Location>(name);
}

inline void Querier::insert_location(models::Location location) {
  this->m_storage->replace(location);
}

auto Querier::insert_locations(std::vector<models::Location> locations) {
  return this->m_storage->transaction([&] {
    for (const auto &location : locations) {
      this->m_storage->replace(location);
    }
    return true;
  });
}

inline void Querier::remove_location(std::string name) {
  this->m_storage->remove<models::Location>(name);
}

inline void Querier::update_location(models::Location updated_location) {
  this->m_storage->update(updated_location);
}

inline models::Character Querier::get_character(std::string name) {
  return this->m_storage->get<models::Character>(name);
}

inline void Querier::insert_character(models::Character character) {
  this->m_storage->insert(character);
}

auto Querier::insert_characters(std::vector<models::Character> characters) {
  return this->m_storage->transaction([&] {
    for (const auto &character : characters) {
      this->m_storage->replace(character);
    }
    return true;
  });
}

inline void Querier::remove_character(std::string name) {
  this->m_storage->remove<models::Character>(name);
}

inline void Querier::update_character(models::Character updated_character) {
  this->m_storage->update(updated_character);
}

inline models::Dialogue Querier::get_dialogue(std::string name) {
  return this->m_storage->get<models::Dialogue>(name);
}

inline void Querier::insert_dialogue(models::Dialogue dialogue) {
  this->m_storage->insert(dialogue);
}

auto Querier::insert_dialogues(std::vector<models::Dialogue> dialogues) {
  return this->m_storage->transaction([&] {
    for (const auto &dialogue : dialogues) {
      this->m_storage->insert(dialogue);
    }
    return true;
  });
}

inline void Querier::remove_dialogue(std::string name) {
  this->m_storage->remove<models::Dialogue>(name);
}

inline void Querier::update_dialogue(models::Dialogue updated_dialogue) {
  this->m_storage->update(updated_dialogue);
}

inline models::Node Querier::get_node(std::string name) {
  return this->m_storage->get<models::Node>(name);
}

inline void Querier::insert_node(models::Node node) {
  this->m_storage->insert(node);
}

auto Querier::insert_nodes(std::vector<models::Node> nodes) {
  return this->m_storage->transaction([&] {
    for (const auto &node : nodes) {
      this->m_storage->insert(node);
    }
    return true;
  });
}

inline void Querier::remove_node(std::string name) {
  this->m_storage->remove<models::Node>(name);
}

inline void Querier::update_node(models::Node updated_node) {
  this->m_storage->update(updated_node);
}

#ifdef TESTING
#include <fstream>

void Querier::dump_from_file(const std::filesystem::path &path) {
  std::fstream file(path);
  json j;
  file >> j;

  auto data = j.get<File>();

  if (data.items) {
    this->insert_items(data.items.value());
  }

  if (data.characters) {
    this->insert_characters(data.characters.value());
  }

  if (data.dialogues) {
    this->insert_dialogues(data.dialogues.value());
  }

  if (data.locations) {
    this->insert_locations(data.locations.value());
  }

  if (data.nodes) {
    this->insert_nodes(data.nodes.value());
  }
}
#endif