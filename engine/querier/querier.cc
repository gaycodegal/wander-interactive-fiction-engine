#include "querier.hh"

#include <iostream>
using namespace sqlite_orm;

Querier::Querier(const std::string &path) {
	this->m_storage = std::make_unique<Storage>(initStorage(path));
	this->m_storage->sync_schema();
	this->m_storage->pragma.synchronous(0);
}

std::vector<Item> Querier::query_items(
	std::optional<std::string> name,
	std::optional<std::vector<std::string>> attributes,
	std::optional<std::vector<std::string>> components
) {
	std::vector<Item> items;   
	if (name) {
		return this->m_storage->get_all<Item>(
			where(like(&Item::name, "%" + name.value() + "%"))
		);
	}

	// auto query = this->m_storage->prepare();

	if (attributes) {
		for (const auto &attr : attributes.value()) {
			std::cout << attr << std::endl;
		}
	}

	if (components) {
		for (const auto &comp : components.value()) {
			std::cout << comp << std::endl;
		}
	}

	return items;
}