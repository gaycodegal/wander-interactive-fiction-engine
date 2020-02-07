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

 public:
  int parse_sentence(std::string& sentence);
  void init_rules(std::string& rules);
  void parse_rule_value(std::string& rule_type, std::string& value);
  void new_n_pair_rule(std::string& rule_type, std::vector<std::string>& vals);
  void new_pair_rule(std::string& rule_type, std::string& k1, std::string& k2);
  void new_terminal_rule(std::string& rule_type, std::string& k1);
  std::string next_gen_name(const std::string& rule_type);
};
}  // namespace cfg
