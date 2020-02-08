#include "lang.hh"
#include "cyk_intermediate.hh"

using namespace cfg;
using std::cerr;
using std::cout;
using std::string;
using std::unordered_map;
using std::vector;

static inline size_t index2(size_t dimX, size_t dimY, size_t x, size_t y) {
  if (x >= dimX || y >= dimY) {
    cerr << "indexing broke" << std::endl;
    return 0;
  }
  return x + y * dimX;
}

static inline bool is_first_char_lower(const string& s) {
  return s.size() >= 1 && std::islower(s[0]);
}

static inline bool is_first_char_upper(const string& s) {
  return s.size() >= 1 && std::isupper(s[0]);
}

string Lang::next_gen_name(const string& rule_type) {
  return std::to_string(++gen);
}

static void rule_parsing_error(const char* message, const string& rule_type,
                               const string& value) {
  cerr << "[Ignored] Bad rule " << rule_type << ": " << value
       << "\nReason: " << message << "" << std::endl;
}

static string key_of_pair(const string& k1, const string& k2) {
  return k1 + "::" + k2;
}

/**
 * Parses and initializes up the Lang's rules.
 */
void Lang::init_rules(const string& rules) {
  auto split_rules = util::split(rules, '\n');
  split_rules = util::filter<string>(split_rules,
                                     [](const auto& s) { return !s.empty(); });
  for (const auto& rule : split_rules) {
    const auto parts = util::split(rule, ':');
    if (parts.size() != 2) {
      cerr << "[Ignored] Badly formatted rule '" << rule << "'" << std::endl;
      continue;
    }
    const auto& rule_type = parts[0];
    const auto& values = parts[1];
    auto split_values = util::split(values, '|');
    for (auto& value : split_values) {
      parse_rule_value(rule_type, value);
    }
  }
  return;
}

void Lang::parse_rule_value(const string& rule_type, const string& value) {
  const auto names = util::split_whitespace(value);
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
    if (is_first_char_upper(names[0]) && is_first_char_upper(names[1])) {
      new_pair_rule(rule_type, names[0], names[1]);
    } else {
      rule_parsing_error("Unions must be between non-terminal vars", rule_type,
                         value);
    }
    return;
  }

  // terminal definition handling
  if (is_first_char_lower(names[0])) {
    new_terminal_rule(rule_type, names[0]);
  } else {
    rule_parsing_error("No unit rules", rule_type, value);
  }
  return;
}

void Lang::new_n_pair_rule(const string& rule_type,
                           const vector<string>& vals) {
  // check all non-terminal symbols
  for (const auto& sym : vals) {
    if (!is_first_char_upper(sym)) {
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

void Lang::new_terminal_rule(const string& rule_type, const string& terminal) {
  if (auto match = terminals.find(terminal); match != terminals.end()) {
    auto& val = match->second;
    val.push_back(rule_type);
    return;
  }
  terminals.insert({terminal, {rule_type}});
}

void Lang::new_pair_rule(const string& rule_type, const string& k1,
                         const string& k2) {
  auto key = key_of_pair(k1, k2);
  if (auto match = pairs.find(key); match != pairs.end()) {
    auto& val = match->second;
    val.push_back(rule_type);
    return;
  }
  pairs.insert({key, {rule_type}});
}

void Lang::init_words(const string& definitions) {
  auto split_words = util::split(definitions, '\n');
  util::map_in_place<string>(split_words, util::trim);
  split_words = util::filter<string>(split_words,
                                     [](const auto& s) { return !s.empty(); });
  for (const auto& word : split_words) {
    const auto pair = util::split_whitespace(word);
    if (pair.size() == 2) {
      const auto& word = pair[0];
      const auto& terminal = pair[1];
      const auto match = words.find(word);
      if (match == words.end()) {
        words.insert({word, terminal});
      }
    }
  }
}

int Lang::parse_sentence(const string& sentence) {
  const auto origins = util::split_whitespace(sentence);
  const auto temp_words =
      util::map<string, string>(origins, [&](const auto& origin) {
        if (const auto match = words.find(origin); match != this->words.end()) {
          return match->second;
        } else {
          return string("");
        }
      });
  const auto words = util::filter<string>(
      temp_words, [](const auto& s) { return !s.empty(); });
  const auto n = words.size();

  // Check for and report unknown words
  if (n != origins.size()) {
    cerr << "Unknown words:" << std::endl;
    for (const auto& invalid : origins) {
      if (this->words.find(invalid) == this->words.end()) {
        cerr << "Not a word: '" << invalid << "'" << std::endl;
      }
    }
    return -1;
  }

  vector<unordered_map<string, CYKIntermediate>> matrix{n * n};
  std::generate(matrix.begin(), matrix.end(),
                []() { return unordered_map<string, CYKIntermediate>(); });

  // Initialize matrix with the sentence
  size_t s = 0;
  for (size_t wi = 0; wi < words.size(); ++wi) {
    const auto& word = words[wi];
    const auto& origin = origins[wi];
    if (const auto match = this->terminals.find(word);
        match != this->terminals.end()) {
      const auto& keys = match->second;
      const auto ind = index2(n, n, 0, s);
      auto& map = matrix[ind];
      for (const auto& key : keys) {
        Word word_val = {word, origin};
        CYKIntermediate val{word_val};
        map.insert({key, word_val});
      }
    } else {
      cerr << "Unusable word " << word << std::endl;
      return 0;
    }
    ++s;
  }

  return -1;
}
