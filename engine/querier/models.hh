#include <memory>

using namespace std;

struct User {
	int id;
	string firstName;
	string lastName;
	int birthDate;
	shared_ptr<string> imageUrl;
	int typeId;
};


struct Item {
	string name;
	shared_ptr<string> description;
	shared_ptr<string> attributes;
	shared_ptr<string> components;
};

class Location {
	public:
		string name;
		shared_ptr<string> description;
		shared_ptr<string> neighbors;
		shared_ptr<string> characters;

		Location() {}
		Location(string name_, shared_ptr<string> description_, shared_ptr<string> neighbors_, shared_ptr<string> characters_, shared_ptr<string> items_)
			: name(move(name_)), description(move(description_)), neighbors(move(neighbors)), characters(move(characters_)), m_items(move(items_)) {}

		shared_ptr<string> getItems() {
			return this->m_items;
		}

		void setItems(shared_ptr<string> items) {
			this->m_items = move(items);
		}

		void dialogues() {}
		void items() {}

	private:
		shared_ptr<string> m_items;
};

class Character {
	public:
		string name;
		shared_ptr<string> components;

		Character() {}
		Character(string name_, shared_ptr<string> components_)
			: name(move(name_)), components(move(components_)) {}

		void dialogues() {}
};

class Dialogue {
	public:
		int id;
		string name;
		string characters;
		shared_ptr<string> flags;
		string location;
		int priority;

		Dialogue() {}
		Dialogue(int id_, string name_, string characters_, shared_ptr<string> flags_, string location_, int priority_, string dialogue_)
			: id(id_), name(move(name_)), characters(move(characters_)), flags(move(flags_)), location(move(location_)), priority(priority_), m_dialogue(move(dialogue_)) {}
		
		string getDialogue() {
			return this->m_dialogue;
		}

		void setDialogue(string dialogue) {
			this->m_dialogue = move(dialogue);
		}

		void dialogue() {}

		private:
			string m_dialogue;
};

class Node {
	public:
		int id;
		Node() {}
		Node(int id_, string dialogue_)
			: id(id_), m_dialogue(move(dialogue_)) {}

		string getDialogue() {
			return this->m_dialogue;
		}

		void setDialogue(string dialogue) {
			this->m_dialogue = move(dialogue);
		}

		void dialogue() {}

		private:
			string m_dialogue;
};

