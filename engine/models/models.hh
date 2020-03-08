#pragma once

#include "dialogue_tree.hh"

namespace models {
struct PatternOne {
  Str value;
};
struct PatternTwo {
  Str value;
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
  Str name;
  Opt<Str> description;
  Opt<Str> attributes;
  Opt<Str> components;

  Item() {}
  Item(Str name_, Opt<Str> description_, Opt<Str> attributes_,
       Opt<Str> components_)
      : name(move(name_)),
        description(move(description_)),
        attributes(move(attributes_)),
        components(move(components_)) {}

  friend std::ostream& operator<<(std::ostream& out, models::Item const& item) {
    json j = item;
    out << j.dump(4);
    return out;
  }

  friend bool operator==(const Item& lhs, const Item& rhs) {
    return (lhs.name == rhs.name &&
            lhs.description.value() == rhs.description.value() &&
            lhs.attributes.value() == rhs.attributes.value() &&
            lhs.components.value() == rhs.components.value());
  }

  friend bool operator!=(const Item& lhs, const Item& rhs) {
    return !(lhs == rhs);
  }
};

class Location {
 public:
  Str name;
  Opt<Str> description;
  Opt<Str> neighbors;
  Opt<Str> characters;

  Location() {}
  Location(Str name_, Opt<Str> description_, Opt<Str> neighbors_,
           Opt<Str> characters_, Opt<Str> items_)
      : name(move(name_)),
        description(move(description_)),
        neighbors(move(neighbors)),
        characters(move(characters_)),
        m_items(move(items_)) {}

  Opt<Str> getItems() { return this->m_items; }
  void setItems(Opt<Str> items) { this->m_items = move(items); }

  friend std::ostream& operator<<(std::ostream& out,
                                  models::Location const& location) {
    json j = location;
    out << j.dump(4);
    return out;
  }

 private:
  Opt<Str> m_items;

  friend void to_json(json& j, const Location& item);
  friend void from_json(const json& j, Location& item);
};

class Character {
 public:
  Str name;
  Opt<Str> components;

  Character() {}
  Character(Str name_, Opt<Str> components_)
      : name(move(name_)), components(move(components_)) {}

  friend std::ostream& operator<<(std::ostream& out,
                                  models::Character const& character) {
    json j = character;
    out << j.dump(4);
    return out;
  }
};

class Dialogue {
 public:
  int id;
  Str characters;
  Opt<Str> flags;
  Str location;
  int priority;

  Dialogue() {}
  Dialogue(int id_, Str characters_, Opt<Str> flags_, Str location_,
           int priority_, Str dialogue_)
      : id(id_),
        characters(move(characters_)),
        flags(move(flags_)),
        location(move(location_)),
        priority(priority_),
        m_dialogue(move(dialogue_)) {}

  Str getDialogue() { return this->m_dialogue; }
  void setDialogue(Str dialogue) { this->m_dialogue = move(dialogue); }
  inline Story dialogue();

  friend std::ostream& operator<<(std::ostream& out,
                                  models::Dialogue const& dialogue) {
    json j = dialogue;
    out << j.dump(4);
    return out;
  }

 private:
  Str m_dialogue;

  friend void to_json(json& j, const Dialogue& item);
  friend void from_json(const json& j, Dialogue& item);
};

class Node {
 public:
  int id;
  Node() {}
  Node(int id_, Str dialogue_) : id(id_), m_dialogue(move(dialogue_)) {}

  Str getDialogue() { return this->m_dialogue; }
  void setDialogue(Str dialogue) { this->m_dialogue = move(dialogue); }
  inline Story dialogue();

  friend std::ostream& operator<<(std::ostream& out, models::Node const& node) {
    json j = node;
    out << j.dump(4);
    return out;
  }

 private:
  Str m_dialogue;

  friend void to_json(json& j, const Node& item);
  friend void from_json(const json& j, Node& item);
};

}  // namespace models