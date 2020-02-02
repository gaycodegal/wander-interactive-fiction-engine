#include "models.hh"
#include "sqlite_orm.hh"

using namespace sqlite_orm;

auto initStorage(const std::string &path){
	return make_storage(
		path,
		make_table("items",

		make_column("name", &Item::name, primary_key()),
		make_column("description", &Item::description),
		make_column("attributes", &Item::attributes),
		make_column("components", &Item::components)),

		make_table("locations",
		make_column("name", &Location::name, primary_key()),
		make_column("description", &Location::description),
		make_column("neighbors", &Location::neighbors),
		make_column("characters", &Location::characters),
		make_column("items", &Location::getItems, &Location::setItems)),

		make_table("characters",
		make_column("name", &Character::name, primary_key()),
		make_column("components", &Character::components)),

		make_table("dialogues",
		make_column("id", &Dialogue::id, autoincrement(), primary_key()),
		make_column("name", &Dialogue::name),
		make_column("characters", &Dialogue::characters),
		make_column("flags", &Dialogue::flags),
		make_column("location", &Dialogue::location),
		make_column("priority", &Dialogue::priority),
		make_column("dialogue", &Dialogue::getDialogue, &Dialogue::setDialogue)),

		make_table("nodes",
		make_column("id", &Node::id, autoincrement(), primary_key()),
		make_column("dialogue", &Node::getDialogue, &Dialogue::setDialogue))
	);
}
using Storage = decltype(initStorage(""));

class Querier {
	public:
		Querier(const std::string &path) {
			this->m_storage = std::make_unique<Storage>(initStorage(path));
			this->m_storage->sync_schema();
		}
	

	private:
		std::unique_ptr<Storage> m_storage;
}; 