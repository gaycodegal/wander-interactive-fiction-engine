#pragma once
#include <cctype>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

#include "ast_val.hh"
#include "util.hh"

namespace cfg {
struct parsed_sentence {
  Str end_state_name;
  AST::AST* ast;
  ~parsed_sentence() { delete ast; }
};

class Lang {
 private:
  std::unordered_map<Str, Vec<Str>> terminals;
  std::unordered_map<Str, Vec<Str>> pairs;
  std::unordered_map<Str, Str> words;
  int gen = 0;
  std::unordered_map<Str, Str> genLookup;

  void parse_rule_value(const Str& rule_type, const Str& value);
  void new_n_pair_rule(const Str& rule_type, const Vec<Str>& vals);
  void new_pair_rule(const Str& rule_type, const Str& k1, const Str& k2);
  void new_terminal_rule(const Str& rule_type, const Str& k1);
  Str next_gen_name(const Str& rule_type);

 public:
  parsed_sentence* parse_sentence(const Str& sentence,
                                  const Vec<Str> end_state_names);
  void init_rules(const Str& rules);
  void init_words(const Str& words);
};
}  // namespace cfg
