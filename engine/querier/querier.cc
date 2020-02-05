#include "querier.hh"

#include <iostream>
using namespace sqlite_orm;

Querier::Querier(const std::string &path) {
  this->m_storage = std::make_unique<Storage>(initStorage(path));
  this->m_storage->sync_schema();
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

  /* auto query = this->m_storage->prepare(get_all<models::Item>(
    where(
      like(&models::Item::attributes, "%%")
    )
  )); */

  // auto likes = like(&models::Item::name, "%%");

  if (attributes) {
    for (const auto &attr : attributes.value()) {
      std::cout << attr << std::endl;
      // likes = likes and like(&models::Item::attributes, attr);
    }
  }

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