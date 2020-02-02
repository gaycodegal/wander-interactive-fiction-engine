#ifndef _QUERIER_HH_
#define _QUERIER_HH_

#include "models.hh"
#include "sqlite_orm.hh"

auto initStorage(const std::string &path) {
	return sqlite_orm::make_storage(
		path,
		sqlite_orm::make_table("items",

		sqlite_orm::make_column("name", &Item::name, sqlite_orm::primary_key()),
		sqlite_orm::make_column("description", &Item::description),
		sqlite_orm::make_column("attributes", &Item::attributes),
		sqlite_orm::make_column("components", &Item::components)),

		sqlite_orm::make_table("locations",
		sqlite_orm::make_column("name", &Location::name, sqlite_orm::primary_key()),
		sqlite_orm::make_column("description", &Location::description),
		sqlite_orm::make_column("neighbors", &Location::neighbors),
		sqlite_orm::make_column("characters", &Location::characters),
		sqlite_orm::make_column("items", &Location::getItems, &Location::setItems)),

		sqlite_orm::make_table("characters",
		sqlite_orm::make_column("name", &Character::name, sqlite_orm::primary_key()),
		sqlite_orm::make_column("components", &Character::components)),

		sqlite_orm::make_table("dialogues",
		sqlite_orm::make_column("id", &Dialogue::id, sqlite_orm::autoincrement(), sqlite_orm::primary_key()),
		sqlite_orm::make_column("name", &Dialogue::name),
		sqlite_orm::make_column("characters", &Dialogue::characters),
		sqlite_orm::make_column("flags", &Dialogue::flags),
		sqlite_orm::make_column("location", &Dialogue::location),
		sqlite_orm::make_column("priority", &Dialogue::priority),
		sqlite_orm::make_column("dialogue", &Dialogue::getDialogue, &Dialogue::setDialogue)),

		sqlite_orm::make_table("nodes",
		sqlite_orm::make_column("id", &Node::id, sqlite_orm::autoincrement(), sqlite_orm::primary_key()),
		sqlite_orm::make_column("dialogue", &Node::getDialogue, &Dialogue::setDialogue))
	);
}
using Storage = decltype(initStorage(""));

class Querier {
	public:
		Querier(const std::string &path) {
			this->m_storage = std::make_unique<Storage>(initStorage(path));
			this->m_storage->sync_schema();
		}

		void test();
	

	private:
		std::unique_ptr<Storage> m_storage;
}; 

#endif // _QUERIER_HH_