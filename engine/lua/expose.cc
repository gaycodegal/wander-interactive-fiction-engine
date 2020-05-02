#include "expose.hh"

void expose_to_lua(sol::state& lua) {
  lua.new_usertype<cfg::Lang>("Lang", "init_rules", &cfg::Lang::init_rules,
                              "init_words", &cfg::Lang::init_words);
}

int main() {
  sol::state lua;
  expose_to_lua(lua);
  lua.script("lang = Lang.new()\n");
  return 0;
}
