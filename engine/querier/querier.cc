#include "querier.hh"

#include <fstream>
using namespace sqlite_orm;

void to_json(json& j, const File& file) {
	j = json{
      {"items", file.items},
			{"locations", file.locations},
			{"characters", file.characters},
			{"dialogues", file.dialogues},
			{"nodes", file.nodes},
  };
}

void from_json(const json& j, File& file) {
  j.at("items").get_to(file.items);
	j.at("locations").get_to(file.locations);
	j.at("characters").get_to(file.characters);
	j.at("dialogues").get_to(file.dialogues);
	j.at("nodes").get_to(file.nodes);
}

Querier::Querier(const std::string &path) {
  this->m_storage = std::make_unique<Storage>(initStorage(path));
  // this->m_storage->sync_schema();
  this->m_storage->pragma.synchronous(0);
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

auto Querier::insert_items(std::vector<models::Item> items) {
  return this->m_storage->transaction([&] {
    for (const auto &item : items) {
      this->m_storage->insert(item);
    }
    return true;
  });
}

auto Querier::insert_locations(std::vector<models::Location> locations) {
  return this->m_storage->transaction([&] {
    for (const auto &location : locations) {
      this->m_storage->insert(location);
    }
    return true;
  });
}

auto Querier::insert_characters(std::vector<models::Character> characters) {
  return this->m_storage->transaction([&] {
    for (const auto &character : characters) {
      this->m_storage->insert(character);
    }
    return true;
  });
}

auto Querier::insert_dialogues(std::vector<models::Dialogue> dialogues) {
  return this->m_storage->transaction([&] {
    for (const auto &dialogue : dialogues) {
      this->m_storage->insert(dialogue);
    }
    return true;
  });
}

auto Querier::insert_nodes(std::vector<models::Node> nodes) {
  return this->m_storage->transaction([&] {
    for (const auto &node : nodes) {
      this->m_storage->insert(node);
    }
    return true;
  });
}

#include <iostream>
void Querier::dump_from_file(const std::filesystem::path& path) {
	std::fstream file(path);
	json j;
	file >> j;

	auto data = j.get<File>();
	std::cout << "here" << std::endl;
	/* for (const auto& item : data.items.value()) {
		std::cout << "item: " << item.name << std::endl;
		this->insert_item(item);
	} */

	if (data.items) {
		this->insert_items(data.items.value());
	}

	/* if (data.characters) {
		this->insert_characters(data.characters.value());
	}

	if (data.dialogues) {
		this->insert_dialogues(data.dialogues.value());
	}

	if (data.nodes) {
		this->insert_nodes(data.nodes.value());
	} */
}
