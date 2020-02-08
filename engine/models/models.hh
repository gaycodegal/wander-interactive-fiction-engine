#pragma once

#include <memory>
#include <optional>

#include "json.hh"

using nlohmann::json;

namespace models {
struct Pattern {
  std::string value;
};

// Item JSON functions
class Item;
void to_json(json& j, const Item& item);
void from_json(const json& j, Item& item);
// Location JSON functions
class Location;
void to_json(json& j, const Location& item);
void from_json(const json& j, Location& item);
// Character JSON functions
class Character;
void to_json(json& j, const Character& item);
void from_json(const json& j, Character& item);
// Dialogue JSON functions
class Dialogue;
void to_json(json& j, const Dialogue& item);
void from_json(const json& j, Dialogue& item);
// Node JSON functions
class Node;
void to_json(json& j, const Node& item);
void from_json(const json& j, Node& item);

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

  friend std::ostream& operator<<(std::ostream &out, models::Item const& item) {
    json j = item;
    out << j.dump(4);
    return out;
  }
};

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

  friend std::ostream& operator<<(std::ostream &out, models::Location const& location) {
    json j = location;
    out << j.dump(4);
    return out;
  }

 private:
  std::optional<std::string> m_items;

  friend void to_json(json& j, const Location& item);
  friend void from_json(const json& j, Location& item);
};

class Character {
 public:
  std::string name;
  std::optional<std::string> components;

  Character() {}
  Character(std::string name_, std::optional<std::string> components_)
      : name(move(name_)), components(move(components_)) {}

  friend std::ostream& operator<<(std::ostream &out, models::Character const& character) {
    json j = character;
    out << j.dump(4);
    return out;
  }

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

  friend std::ostream& operator<<(std::ostream &out, models::Dialogue const& dialogue) {
    json j = dialogue;
    out << j.dump(4);
    return out;
  }

 private:
  std::string m_dialogue;

  friend void to_json(json& j, const Dialogue& item);
  friend void from_json(const json& j, Dialogue& item);
};

class Node {
 public:
  int id;
  Node() {}
  Node(int id_, std::string dialogue_) : id(id_), m_dialogue(move(dialogue_)) {}

  std::string getDialogue() { return this->m_dialogue; }
  void setDialogue(std::string dialogue) { this->m_dialogue = move(dialogue); }
  void dialogue();

  friend std::ostream& operator<<(std::ostream &out, models::Node const& node) {
    json j = node;
    out << j.dump(4);
    return out;
  }

 private:
  std::string m_dialogue;

  friend void to_json(json& j, const Node& item);
  friend void from_json(const json& j, Node& item);
};

}  // namespace models