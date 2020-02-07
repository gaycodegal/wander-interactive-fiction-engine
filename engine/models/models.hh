#pragma once

#include <memory>
#include <optional>

#include "json.hh"

namespace nlohmann {
template <typename T>
struct adl_serializer<std::optional<T>> {
  static void to_json(json& j, const std::optional<T>& opt) {
    if (!opt) {
      j = {};
    } else {
      j = opt.value();
    }
  }

  static void from_json(const json& j, std::optional<T>& opt) {
    if (j.is_null()) {
      opt = {};
    } else {
      opt = j.get<T>();
    }
  }
};
}  // namespace nlohmann

using nlohmann::json;

namespace models {
struct Pattern {
  std::string value;
};

class Item {
 public:
  std::string name;
  std::optional<std::string> description;
  std::optional<std::string> attributes;
  std::optional<std::string> components;

  Item() {}
  Item(std::string name_, std::optional<std::string> description_,
       std::optional<std::string> attributes_,
       std::optional<std::string> components_)
      : name(move(name_)),
        description(move(description_)),
        attributes(move(attributes_)),
        components(move(components_)) {}
};

void to_json(json& j, const Item& item);
void from_json(const json& j, Item& item);

class Location {
 public:
  std::string name;
  std::optional<std::string> description;
  std::optional<std::string> neighbors;
  std::optional<std::string> characters;

  Location() {}
  Location(std::string name_, std::optional<std::string> description_,
           std::optional<std::string> neighbors_,
           std::optional<std::string> characters_,
           std::optional<std::string> items_)
      : name(move(name_)),
        description(move(description_)),
        neighbors(move(neighbors)),
        characters(move(characters_)),
        m_items(move(items_)) {}

  std::optional<std::string> getItems() { return this->m_items; }
  void setItems(std::optional<std::string> items) {
    this->m_items = move(items);
  }
  void dialogues();
  void items();

 private:
  std::optional<std::string> m_items;
};

class Character {
 public:
  std::string name;
  std::optional<std::string> components;

  Character() {}
  Character(std::string name_, std::optional<std::string> components_)
      : name(move(name_)), components(move(components_)) {}

  void dialogues();
};

class Dialogue {
 public:
  int id;
  std::string characters;
  std::optional<std::string> flags;
  std::string location;
  int priority;

  Dialogue() {}
  Dialogue(int id_, std::string characters_, std::optional<std::string> flags_,
           std::string location_, int priority_, std::string dialogue_)
      : id(id_),
        characters(move(characters_)),
        flags(move(flags_)),
        location(move(location_)),
        priority(priority_),
        m_dialogue(move(dialogue_)) {}

  std::string getDialogue() { return this->m_dialogue; }
  void setDialogue(std::string dialogue) { this->m_dialogue = move(dialogue); }
  void dialogue();

 private:
  std::string m_dialogue;
};

class Node {
 public:
  int id;
  Node() {}
  Node(int id_, std::string dialogue_) : id(id_), m_dialogue(move(dialogue_)) {}

  std::string getDialogue() { return this->m_dialogue; }
  void setDialogue(std::string dialogue) { this->m_dialogue = move(dialogue); }
  void dialogue();

 private:
  std::string m_dialogue;
};

}  // namespace models