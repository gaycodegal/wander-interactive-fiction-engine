#pragma once

#include "json.hh"
#include "types.hh"

using nlohmann::json;

struct Talk {
  Str who;
  Str what;
};

struct Choice {
  Str what;
  int next;
};

struct Story {
  Vec<Talk> dialogue;
  Opt<Vec<Choice>> choices;
  bool visited;
};

void to_json(json& j, const Talk& talk);
void from_json(const json& j, Talk& talk);
void to_json(json& j, const Choice& choice);
void from_json(const json& j, Choice& choice);
void to_json(json& j, const Story& story);
void from_json(const json& j, Story& story);