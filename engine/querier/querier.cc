#include "querier.hh"

#include "util.hh"

using namespace sqlite_orm;

Str basic_str = "";

Querier::Querier(const std::filesystem::path &path) {
  this->m_storage = std::make_unique<Storage>(initStorage(path));
  if (!std::filesystem::exists(path)) this->m_storage->sync_schema();
}

Vec<models::Item> Querier::query_items(Opt<Str> name, Opt<Vec<Str>> attributes,
                                       Opt<Vec<Str>> components) {
  if (!name && !attributes && !components)
    return this->m_storage->get_all<models::Item>();

  auto name_pattern = name ? conc(conc("%", name.value()), "%")
                           : conc(conc("%", basic_str), "%");

  Vec<models::Item> items;
  this->m_storage->begin_transaction();

  if (attributes && attributes.value().size() > 0) {
    for (const auto &attr : attributes.value()) {
      models::PatternOne p = {attr};
      this->m_storage->insert(p);
    }
  } else {
    models::PatternOne p = {""};
    this->m_storage->insert(p);
  }
  auto attribute_pattern = conc(conc("%", &models::PatternOne::value), "%");

  if (components && components.value().size() > 0) {
    for (const auto &comp : components.value()) {
      models::PatternTwo p = {comp};
      this->m_storage->insert(p);
    }
  } else {
    models::PatternTwo p = {""};
    this->m_storage->insert(p);
  }
  auto component_pattern = conc(conc("%", &models::PatternTwo::value), "%");

  items = this->m_storage->get_all<models::Item>(where(
      in(&models::Item::name,
         select(&models::Item::name,
                where(like(&models::Item::name, name_pattern) and
                      like(&models::Item::attributes, attribute_pattern) and
                      like(&models::Item::components, component_pattern)),
                group_by(&models::Item::name),
                having(is_equal(count(&models::PatternOne::value),
                                select(count<models::PatternOne>())) and
                       is_equal(count(&models::PatternTwo::value),
                                select(count<models::PatternTwo>())))))));

  this->m_storage->rollback();

  return items;
}

inline models::Item Querier::get_item(Str name) {
  return this->m_storage->get<models::Item>(name);
}

inline void Querier::insert_item(models::Item item) {
  this->m_storage->replace(item);
}

auto Querier::insert_items(Vec<models::Item> items) {
  return this->m_storage->transaction([&] {
    for (const auto &item : items) {
      this->m_storage->replace(item);
    }
    return true;
  });
}

inline void Querier::remove_item(Str name) {
  this->m_storage->remove<models::Item>(name);
}

inline void Querier::update_item(models::Item updated_item) {
  this->m_storage->update(updated_item);
}

inline models::Location Querier::get_location(Str name) {
  return this->m_storage->get<models::Location>(name);
}

inline void Querier::insert_location(models::Location location) {
  this->m_storage->replace(location);
}

auto Querier::insert_locations(Vec<models::Location> locations) {
  return this->m_storage->transaction([&] {
    for (const auto &location : locations) {
      this->m_storage->replace(location);
    }
    return true;
  });
}

inline void Querier::remove_location(Str name) {
  this->m_storage->remove<models::Location>(name);
}

inline void Querier::update_location(models::Location updated_location) {
  this->m_storage->update(updated_location);
}

inline models::Character Querier::get_character(Str name) {
  return this->m_storage->get<models::Character>(name);
}

inline void Querier::insert_character(models::Character character) {
  this->m_storage->insert(character);
}

auto Querier::insert_characters(Vec<models::Character> characters) {
  return this->m_storage->transaction([&] {
    for (const auto &character : characters) {
      this->m_storage->replace(character);
    }
    return true;
  });
}

inline void Querier::remove_character(Str name) {
  this->m_storage->remove<models::Character>(name);
}

inline void Querier::update_character(models::Character updated_character) {
  this->m_storage->update(updated_character);
}

inline models::Dialogue Querier::get_dialogue(Str name) {
  return this->m_storage->get<models::Dialogue>(name);
}

inline void Querier::insert_dialogue(models::Dialogue dialogue) {
  this->m_storage->insert(dialogue);
}

auto Querier::insert_dialogues(Vec<models::Dialogue> dialogues) {
  return this->m_storage->transaction([&] {
    for (const auto &dialogue : dialogues) {
      this->m_storage->insert(dialogue);
    }
    return true;
  });
}

inline void Querier::remove_dialogue(Str name) {
  this->m_storage->remove<models::Dialogue>(name);
}

inline void Querier::update_dialogue(models::Dialogue updated_dialogue) {
  this->m_storage->update(updated_dialogue);
}

inline models::Node Querier::get_node(Str name) {
  return this->m_storage->get<models::Node>(name);
}

inline void Querier::insert_node(models::Node node) {
  this->m_storage->insert(node);
}

auto Querier::insert_nodes(Vec<models::Node> nodes) {
  return this->m_storage->transaction([&] {
    for (const auto &node : nodes) {
      this->m_storage->insert(node);
    }
    return true;
  });
}

inline void Querier::remove_node(Str name) {
  this->m_storage->remove<models::Node>(name);
}

inline void Querier::update_node(models::Node updated_node) {
  this->m_storage->update(updated_node);
}

Vec<models::Dialogue> Querier::get_location_dialogues(models::Location location) {
  return this->m_storage->get_all<models::Dialogue>(
    where(like(&models::Dialogue::location, location.name))
  );
}

Vec<models::Item> Querier::get_location_items(models::Location location) {
  auto items_split = util::split(location.getItems().value(), ',');
  Vec<models::Item> items;

  for (const auto& item_str : items_split) {
    items.push_back(this->m_storage->get<models::Item>(item_str));
  }
  
  return items;
}

Vec<models::Dialogue> Querier::get_character_dialogues(models::Character character) {
  return this->m_storage->get_all<models::Dialogue>(
    where(like(&models::Dialogue::location, character.name))
  );
}

#ifdef TESTING
#include <fstream>

struct File {
  Opt<Vec<models::Item>> items;
  Opt<Vec<models::Location>> locations;
  Opt<Vec<models::Character>> characters;
  Opt<Vec<models::Dialogue>> dialogues;
  Opt<Vec<models::Node>> nodes;
};

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