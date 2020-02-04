#ifndef _QUERIER_MODELS_HH_
#define _QUERIER_MODELS_HH_

#include <memory>

struct Item {
  std::string name;
  std::shared_ptr<std::string> description;
  std::shared_ptr<std::string> attributes;
  std::shared_ptr<std::string> components;
};

class Location {
 public:
  std::string name;
  std::shared_ptr<std::string> description;
  std::shared_ptr<std::string> neighbors;
  std::shared_ptr<std::string> characters;

  Location() {}
  Location(std::string name_, std::shared_ptr<std::string> description_,
           std::shared_ptr<std::string> neighbors_,
           std::shared_ptr<std::string> characters_,
           std::shared_ptr<std::string> items_)
      : name(move(name_)),
        description(move(description_)),
        neighbors(move(neighbors)),
        characters(move(characters_)),
        m_items(move(items_)) {}

  inline std::shared_ptr<std::string> getItems() { return this->m_items; }
  inline void setItems(std::shared_ptr<std::string> items) {
    this->m_items = move(items);
  }
  void dialogues();
  void items();

 private:
  std::shared_ptr<std::string> m_items;
};

class Character {
 public:
  std::string name;
  std::shared_ptr<std::string> components;

  Character() {}
  Character(std::string name_, std::shared_ptr<std::string> components_)
      : name(move(name_)), components(move(components_)) {}

  void dialogues();
};

class Dialogue {
 public:
  int id;
  std::string characters;
  std::shared_ptr<std::string> flags;
  std::string location;
  int priority;

  Dialogue() {}
  Dialogue(int id_, std::string characters_,
           std::shared_ptr<std::string> flags_, std::string location_,
           int priority_, std::string dialogue_)
      : id(id_),
        characters(move(characters_)),
        flags(move(flags_)),
        location(move(location_)),
        priority(priority_),
        m_dialogue(move(dialogue_)) {}

  inline std::string getDialogue() { return this->m_dialogue; }
  inline void setDialogue(std::string dialogue) {
    this->m_dialogue = move(dialogue);
  }
  void dialogue();

 private:
  std::string m_dialogue;
};

class Node {
 public:
  int id;
  Node() {}
  Node(int id_, std::string dialogue_) : id(id_), m_dialogue(move(dialogue_)) {}

  inline std::string getDialogue() { return this->m_dialogue; }
  inline void setDialogue(std::string dialogue) {
    this->m_dialogue = move(dialogue);
  }
  void dialogue();

 private:
  std::string m_dialogue;
};

#endif  // _QUERIER_MODELS_HH_