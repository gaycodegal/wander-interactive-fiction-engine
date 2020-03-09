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

void Querier::insert_items(Vec<models::Item> items) {
  this->m_storage->transaction([&] {
    for (const auto &item : items) {
      this->m_storage->replace(item);
    }
    return true;
  });
}

auto Querier::insert_locations(Vec<models::Location> locations) {
  return this->m_storage->transaction([&] {
    for (const auto &location : locations) {
      this->m_storage->replace(location);
    }
    return true;
  });
}

Vec<models::Item> Querier::get_location_items(models::Location location) {
  auto items_split = util::split(location.getItems().value(), ',');
  Vec<models::Item> items;

  for (const auto &item_str : items_split) {
    items.push_back(this->m_storage->get<models::Item>(item_str));
  }

  return items;
}

auto Querier::insert_characters(Vec<models::Character> characters) {
  return this->m_storage->transaction([&] {
    for (const auto &character : characters) {
      this->m_storage->replace(character);
    }
    return true;
  });
}

inline Vec<models::Dialogue> Querier::get_character_dialogues(
    models::Character character) {
  return this->m_storage->get_all<models::Dialogue>(
      where(like(&models::Dialogue::location, character.name)));
}

auto Querier::insert_dialogues(Vec<models::Dialogue> dialogues) {
  return this->m_storage->transaction([&] {
    for (const auto &dialogue : dialogues) {
      this->m_storage->insert(dialogue);
    }
    return true;
  });
}

auto Querier::insert_nodes(Vec<models::Node> nodes) {
  return this->m_storage->transaction([&] {
    for (const auto &node : nodes) {
      this->m_storage->insert(node);
    }
    return true;
  });
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