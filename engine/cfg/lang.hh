#pragma once
#include <string>
#include <unordered_map>
#include <vector>

#include "filter.hh"
#include "split-whitespace.hh"

namespace cfg {
class Lang {
 private:
  std::unordered_map<std::string, std::vector<std::string>> terminals;
  std::unordered_map<std::string, std::vector<std::string>> pairs;
  std::unordered_map<std::string, std::string> words;
  int gen;
  std::unordered_map<std::string, std::string> genLookup;

 public:
  int parse_sentence(std::string sentence);
};
}  // namespace cfg
