#include <memory>

#include "sqlite_orm.hh"

struct User{
	int id;
	std::string firstName;
	std::string lastName;
	int birthDate;
	std::shared_ptr<std::string> imageUrl;
	int typeId;
};

using namespace sqlite_orm;

auto initStorage(const std::string &path){
    return make_storage(
			path,
			make_table("users",
			make_column("id", &User::id, autoincrement(), primary_key()),
			make_column("first_name", &User::firstName),
			make_column("last_name", &User::lastName),
			make_column("birth_date", &User::birthDate),
			make_column("image_url", &User::imageUrl),
			make_column("type_id", &User::typeId))
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