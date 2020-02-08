#pragma once
#include <cctype>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

#include "cyk_intermediate.hh"
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
  void new_n_pair_rule(const std::string& rule_type,
                       const std::vector<std::string>& vals);
  void new_pair_rule(const std::string& rule_type, const std::string& k1,
                     const std::string& k2);
  void new_terminal_rule(const std::string& rule_type, const std::string& k1);
  std::string next_gen_name(const std::string& rule_type);
  void cyk_add_pairs_to_matrix(
      std::vector<std::unordered_map<std::string, CYKIntermediate>>& matrix,
      std::unordered_map<std::string, CYKIntermediate>& left,
      std::unordered_map<std::string, CYKIntermediate>& right, size_t l_ind,
      size_t r_ind, size_t insert_ind);

 public:
  int parse_sentence(const std::string& sentence);
  void init_rules(const std::string& rules);
  void init_words(const std::string& words);
};
}  // namespace cfg
