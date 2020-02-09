#include "types.hh"
struct Talk {
  Str who;
  Str what;
};

struct Choice {
  Str what;
  int next;
};

struct Story {
  Vec<Talk> story;
  Opt<Vec<Choice>> select;
  bool visited;
};