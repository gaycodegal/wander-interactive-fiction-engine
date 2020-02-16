#include "dialogue_tree.hh"

void to_json(json& j, const Talk& talk) {
  j = json{
      {"who", talk.who},
      {"what", talk.what},
  };
}

void from_json(const json& j, Talk& talk) {
  j.at("who").get_to(talk.who);
  j.at("what").get_to(talk.what);
}

void to_json(json& j, const Choice& choice) {
  j = json{
      {"what", choice.what},
      {"next", choice.next},
  };
}

void from_json(const json& j, Choice& choice) {
  j.at("what").get_to(choice.what);
  j.at("next").get_to(choice.next);
}

void to_json(json& j, const Story& story) {
  j = json{
      {"dialogue", story.dialogue},
      {"choices", story.choices},
      {"visited", story.visited},
  };
}

void from_json(const json& j, Story& story) {
  j.at("dialogue").get_to(story.dialogue);
  j.at("choices").get_to(story.choices);
  j.at("visited").get_to(story.visited);
}