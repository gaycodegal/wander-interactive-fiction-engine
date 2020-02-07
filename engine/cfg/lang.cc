#include "lang.hh"

using namespace cfg;

std::string Lang::next_gen_name(const std::string& rule_type) {
  return std::to_string(++gen);
}

static void rule_parsing_error(const char* message,
                               const std::string& rule_type,
                               const std::string& value) {
  std::cerr << "[Ignored] Bad rule " << rule_type << ": " << value
            << "\nReason: " << message << "" << std::endl;
}

static std::string key_of_pair(const std::string& k1, const std::string& k2) {
  return k1 + "::" + k2;
}

int Lang::parse_sentence(const std::string& sentence) {
  auto origins = util::split_whitespace(sentence);
  auto temp_words =
      util::map<std::string, std::string>(origins, [&](const auto& origin) {
        if (auto match = words.find(origin); match != this->words.end()) {
          return match->second;
        } else {
          return std::string("");
        }
      });
  auto words = util::filter<std::string>(
      temp_words, [](const auto& s) { return !s.empty(); });
  auto n = words.size();
  if (n != origins.size()) {
    return -1;
  }

  return 0;
}

/**
 * Parses and initializes up the Lang's rules.
 */
void Lang::init_rules(const std::string& rules) {
  auto split_rules = util::split(rules, '\n');
  split_rules = util::filter<std::string>(
      split_rules, [](const auto& s) { return !s.empty(); });
  for (auto& rule : split_rules) {
    auto parts = util::split(rule, ':');
    if (parts.size() != 2) {
      std::cerr << "[Ignored] Badly formatted rule '" << rule << "'"
                << std::endl;
      continue;
    }
    auto rule_type = parts[0];
    auto values = parts[1];
    auto split_values = util::split(values, '|');
    for (auto& value : split_values) {
      parse_rule_value(rule_type, value);
    }
  }
  return;
}

void Lang::parse_rule_value(const std::string& rule_type,
                            const std::string& value) {
  auto names = util::split_whitespace(value);
  auto len_names = names.size();
  if (len_names == 0) {
    rule_parsing_error("Length must be >=1 for rule", rule_type, value);
    return;
  }

  // non-terminal tuple
  if (len_names > 2) {
    new_n_pair_rule(rule_type, names);
    return;
  }

  // non-terminal pair
  if (len_names == 2) {
    if (std::isupper(names[0][0]) && std::isupper(names[1][0])) {
      new_pair_rule(rule_type, names[0], names[1]);
    } else {
      rule_parsing_error("Unions must be between non-terminal vars", rule_type,
                         value);
    }
    return;
  }

  // terminal definition handling
  if (std::islower(names[0][0])) {
    new_terminal_rule(rule_type, names[0]);
  } else {
    rule_parsing_error("No unit rules", rule_type, value);
  }
  return;
}

void Lang::new_n_pair_rule(const std::string& rule_type,
                           const std::vector<std::string>& vals) {
  // check all non-terminal symbols
  for (const auto& sym : vals) {
    if (!std::isupper(sym[0])) {
      rule_parsing_error("Unions must be between non-terminal vars", rule_type,
                         sym);
      return;
    }
  }

  // chain everything together under generated types
  // except the last value pair
  auto first = vals[0];
  auto second = vals[1];
  auto gname = next_gen_name(rule_type);
  new_pair_rule(gname, first, second);
  for (size_t i = 2; i < vals.size() - 1; ++i) {
    first = gname;
    second = vals[i];
    gname = next_gen_name(rule_type);
    new_pair_rule(gname, first, second);
  }

  // the last value pair is the chain together with the last value
  // and is set to the real type so we know what's up.
  first = gname;
  second = vals.back();
  new_pair_rule(rule_type, first, second);
}

void Lang::new_terminal_rule(const std::string& rule_type,
                             const std::string& terminal) {
  if (auto match = terminals.find(terminal); match != terminals.end()) {
    auto& val = match->second;
    val.push_back(rule_type);
    return;
  }
  std::vector<std::string> val = {rule_type};
  terminals.insert({terminal, val});
}

void Lang::new_pair_rule(const std::string& rule_type, const std::string& k1,
                         const std::string& k2) {
  auto key = key_of_pair(k1, k2);
  if (auto match = pairs.find(key); match != pairs.end()) {
    auto& val = match->second;
    val.push_back(rule_type);
    return;
  }
  std::vector<std::string> val = {rule_type};
  pairs.insert({key, val});
}

void Lang::init_words(const std::string& definitions) {
  auto split_words = util::split(definitions, '\n');
  util::map_in_place<std::string>(split_words, util::trim);
  split_words = util::filter<std::string>(
      split_words, [](const auto& s) { return !s.empty(); });
  for (const auto& word : split_words) {
    auto pair = util::split_whitespace(word);
    if (pair.size() == 2) {
      auto word = pair[0];
      auto terminal = pair[1];
      auto match = words.find(word);
      if (match == words.end()) {
        words.insert({word, terminal});
      }
    }
  }
}
