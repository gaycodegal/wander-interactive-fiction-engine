#include "models.hh"

void models::Location::dialogues() { return; }

void models::Location::items() { return; }

void models::Character::dialogues() { return; }

void models::Dialogue::dialogue() { return; }

void models::Node::dialogue() { return; }

void models::to_json(json& j, const Item& item) {
  j = json{
      {"name", item.name},
      {"description", item.description},
      {"attributes", item.attributes},
      {"components", item.components},
  };
}

void models::from_json(const json& j, Item& item) {
  j.at("name").get_to(item.name);
  j.at("description").get_to(item.description);
  j.at("attributes").get_to(item.attributes);
  j.at("components").get_to(item.components);
}

void models::to_json(json& j, const Location& location) {
  j = json{
      {"name", location.name},           {"description", location.description},
      {"neighbors", location.neighbors}, {"characters", location.characters},
      {"items", location.m_items},
  };
}

void models::from_json(const json& j, Location& location) {
  j.at("name").get_to(location.name);
  j.at("description").get_to(location.description);
  j.at("neighbors").get_to(location.neighbors);
  j.at("characters").get_to(location.characters);
  j.at("items").get_to(location.m_items);
}

void models::to_json(json& j, const Character& character) {
  j = json{
      {"name", character.name},
      {"components", character.components},
  };
}

void models::from_json(const json& j, Character& character) {
  j.at("name").get_to(character.name);
  j.at("components").get_to(character.components);
}

void models::to_json(json& j, const Dialogue& dialogue) {
  j = json{
      {"id", dialogue.id},
      {"characters", dialogue.characters},
      {"flags", dialogue.flags},
      {"location", dialogue.location},
      {"priority", dialogue.priority},
      {"dialogue", dialogue.m_dialogue},
  };
}

void models::from_json(const json& j, Dialogue& dialogue) {
  j.at("id").get_to(dialogue.id);
  j.at("characters").get_to(dialogue.characters);
  j.at("flags").get_to(dialogue.flags);
  j.at("location").get_to(dialogue.location);
  j.at("priority").get_to(dialogue.priority);
  j.at("dialogue").get_to(dialogue.m_dialogue);
}

void models::to_json(json& j, const Node& node) {
  j = json{
      {"id", node.id},
      {"dialogue", node.m_dialogue},
  };
}

void models::from_json(const json& j, Node& node) {
  j.at("id").get_to(node.id);
  j.at("dialogue").get_to(node.m_dialogue);
}