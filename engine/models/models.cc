#include "models.hh"

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

void models::Location::dialogues() { return; }

void models::Location::items() { return; }

void models::Character::dialogues() { return; }

void models::Dialogue::dialogue() { return; }

void models::Node::dialogue() { return; }