#include "querier.hh"

#include <iostream>
#include <numeric>
using namespace sqlite_orm;

Querier::Querier(const std::string &path) {
  this->m_storage = std::make_unique<Storage>(initStorage(path));
  this->m_storage->sync_schema();
  this->m_storage->pragma.synchronous(0);
}

static auto like_attr(const std::string &attr) {
  return like(&models::Item::attributes, "%" + attr + "%");
}
using attr_like_type = decltype(like_attr(""));

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

  std::vector<attr_like_type> attr_likes;
  if (attributes) {
    for (const auto &attr : attributes.value()) {
      std::cout << attr << std::endl;
      attr_like_type attr_like = like_attr(attr);
      attr_likes.push_back(attr_like);
    }
  }

  // return this->m_storage->get_all<models::Item>(where(attr_likes[0]));

  if (components) {
    for (const auto &comp : components.value()) {
      std::cout << comp << std::endl;
    }
  }

  return items;
}

inline models::Item Querier::get_item(std::string name) {
  return this->m_storage->get<models::Item>(name);
}

inline auto Querier::insert_item(models::Item item) {
  return this->m_storage->insert(item);
}

auto Querier::insert_items(std::vector<models::Item> items) {
  return this->m_storage->transaction([&] {
    for (const auto &item : items) {
      this->m_storage->insert(item);
    }
    return true;
  });
}

inline auto Querier::remove_item(std::string name) {
  return this->m_storage->remove<models::Item>(name);
}

inline auto Querier::update_item(models::Item updated_item) {
  return this->m_storage->update(updated_item);
}

inline models::Location Querier::get_location(std::string name) {
  return this->m_storage->get<models::Location>(name);
}

/* inline auto Querier::insert_location(models::Location location) {
  return this->m_storage->insert(location);
} */

/* auto Querier::insert_locations(std::vector<models::Location> locations) {
  return this->m_storage->transaction([&] {
    for (const auto &location : locations) {
      this->m_storage->insert(location);
    }
    return true;
  });
} */

inline auto Querier::remove_location(std::string name) {
  return this->m_storage->remove<models::Location>(name);
}

/* inline auto Querier::update_location(models::Location updated_location) {
  return this->m_storage->update(updated_location);
} */

inline models::Character Querier::get_character(std::string name) {
  return this->m_storage->get<models::Character>(name);
}

inline auto Querier::insert_character(models::Character character) {
  return this->m_storage->insert(character);
}

auto Querier::insert_characters(std::vector<models::Character> characters) {
  return this->m_storage->transaction([&] {
    for (const auto &character : characters) {
      this->m_storage->insert(character);
    }
    return true;
  });
}

inline auto Querier::remove_character(std::string name) {
  return this->m_storage->remove<models::Character>(name);
}

inline auto Querier::update_character(models::Character updated_character) {
  return this->m_storage->update(updated_character);
}

inline models::Dialogue Querier::get_dialogue(std::string name) {
  return this->m_storage->get<models::Dialogue>(name);
}

/* inline auto Querier::insert_dialogue(models::Dialogue dialogue) {
  return this->m_storage->insert(dialogue);
} */

/* auto Querier::insert_dialogues(std::vector<models::Dialogue> dialogues) {
  return this->m_storage->transaction([&] {
    for (const auto &dialogue : dialogues) {
      this->m_storage->insert(dialogue);
    }
    return true;
  });
} */

inline auto Querier::remove_dialogue(std::string name) {
  return this->m_storage->remove<models::Dialogue>(name);
}

/* inline auto Querier::update_dialogue(models::Dialogue updated_dialogue) {
  return this->m_storage->update(updated_dialogue);
} */

inline models::Node Querier::get_node(std::string name) {
  return this->m_storage->get<models::Node>(name);
}

/* inline auto Querier::insert_node(models::Node node) {
  return this->m_storage->insert(node);
} */

/* auto Querier::insert_nodes(std::vector<models::Node> nodes) {
  return this->m_storage->transaction([&] {
    for (const auto &node : nodes) {
      this->m_storage->insert(node);
    }
    return true;
  });
} */

inline auto Querier::remove_node(std::string name) {
  return this->m_storage->remove<models::Node>(name);
}

/* inline auto Querier::update_node(models::Node updated_node) {
  return this->m_storage->update(updated_node);
} */