#include "expose.hh"

void expose_to_lua(sol::state& lua) {
  lua.new_usertype<AST::Word>("Word", "word", &AST::Word::word, "origin",
                              &AST::Word::origin);

  lua.new_usertype<AST::Tagged>("Tagged", "symbol", &AST::Tagged::symbol, "ast",
                                &AST::Tagged::ast);

  lua.new_usertype<AST::AST>("AST", "type", &AST::AST::type, "value",
                             &AST::AST::value);
  lua["AST"]["WORD"] = AST::AST::Type::WORD;
  lua["AST"]["TAGGED"] = AST::AST::Type::TAGGED;
  lua["AST"]["RULE"] = AST::AST::Type::RULE;

  lua.new_usertype<cfg::parsed_sentence>("parsed_sentence", "end_state_name",
                                         &cfg::parsed_sentence::end_state_name,
                                         "ast", &cfg::parsed_sentence::ast);

  lua.new_usertype<cfg::Lang>("Lang", "init_rules", &cfg::Lang::init_rules,
                              "init_words", &cfg::Lang::init_words,
                              "parse_sentence", &cfg::Lang::parse_sentence);

  lua.new_usertype<AST::AST::Value>("Value", "rule", &AST::AST::Value::rule,
                                    "word", &AST::AST::Value::word, "tagged",
                                    &AST::AST::Value::tagged);
}
