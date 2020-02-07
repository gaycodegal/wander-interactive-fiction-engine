#pragma once
#include <cctype>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>
#include "filter.hh"
#include "split.hh"

namespace cfg {
class Lang {
 private:
  std::unordered_map<std::string, std::vector<std::string>> terminals;
  std::unordered_map<std::string, std::vector<std::string>> pairs;
  std::unordered_map<std::string, std::string> words;
  int gen = 0;
  std::unordered_map<std::string, std::string> genLookup;

  void parse_rule_value(const std::string& rule_type, const std::string& value);
  void new_n_pair_rule(const std::string& rule_type, const std::vector<std::string>& vals);
  void new_pair_rule(const std::string& rule_type, const std::string& k1, const std::string& k2);
  void new_terminal_rule(const std::string& rule_type, const std::string& k1);
  std::string next_gen_name(const std::string& rule_type);

 public:
  int parse_sentence(const std::string& sentence);
  void init_rules(const std::string& rules);
  void init_words(const std::string& words);
};
}  // namespace cfg
