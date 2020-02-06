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

template <typename T>
inline auto const& Combine(auto &cexpr, attr_like_type &expr) {
	return cexpr and expr;
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

 	std::vector<attr_like_type> attr_likes;
  if (attributes) {
    for (const auto &attr : attributes.value()) {
      std::cout << attr << std::endl;
      attr_like_type attr_like = like_attr(attr);
			attr_likes.push_back(attr_like);
    }
  }

	return this->m_storage->get_all<models::Item>(where(
		attr_likes[0]
	));

  if (components) {
    for (const auto &comp : components.value()) {
      std::cout << comp << std::endl;
    }
  }

  return items;
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