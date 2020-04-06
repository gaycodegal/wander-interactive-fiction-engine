#include "lang.hh"
#include "ast_val.hh"

#include "cyk_intermediate.cc"

using namespace cfg;
using std::cerr;
using std::cout;
using std::unordered_map;

static inline void cyk_add_pairs_to_matrix(
    unordered_map<Str, Vec<Str>> pairs,
    Vec<unordered_map<Str, CYKIntermediate>>& matrix,
    unordered_map<Str, CYKIntermediate>& left,
    unordered_map<Str, CYKIntermediate>& right, size_t l_ind, size_t r_ind,
    size_t insert_ind);

AST::AST* derive_answer(const Vec<unordered_map<Str, CYKIntermediate>>& matrix,
                        const CYKIntermediate& answer);
static inline size_t index2(size_t dimX, size_t dimY, size_t x, size_t y);

static inline bool is_first_char_lower(const Str& s) {
  return s.size() >= 1 && std::islower(s[0]);
}

// N-Pair intermediate checker
static inline bool is_intermediate_rule_symbol(const Str& s) {
  return s.size() >= 1 && s[0] == '_';
}

static inline bool is_first_char_upper(const Str& s) {
  return s.size() >= 1 && std::isupper(s[0]);
}

Str Lang::next_gen_name(const Str& rule_type) { return std::to_string(++gen); }

static void rule_parsing_error(const char* message, const Str& rule_type,
                               const Str& value) {
  cerr << "[Ignored] Bad rule " << rule_type << ": " << value
       << "\nReason: " << message << "" << std::endl;
}

static Str key_of_pair(const Str& k1, const Str& k2) { return k1 + "::" + k2; }

/**
 * Parses and initializes up the Lang's rules.
 */
void Lang::init_rules(const Str& rules) {
  auto split_rules = util::split(rules, '\n');
  split_rules =
      util::filter<Str>(split_rules, [](const auto& s) { return !s.empty(); });
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

void Lang::parse_rule_value(const Str& rule_type, const Str& value) {
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

void Lang::new_n_pair_rule(const Str& rule_type, const Vec<Str>& vals) {
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

void Lang::new_terminal_rule(const Str& rule_type, const Str& terminal) {
  if (auto match = terminals.find(terminal); match != terminals.end()) {
    auto& val = match->second;
    val.push_back(rule_type);
    return;
  }
  terminals.insert({terminal, {rule_type}});
}

void Lang::new_pair_rule(const Str& rule_type, const Str& k1, const Str& k2) {
  auto key = key_of_pair(k1, k2);
  if (auto match = pairs.find(key); match != pairs.end()) {
    auto& val = match->second;
    val.push_back(rule_type);
    return;
  }
  pairs.insert({key, {rule_type}});
}

void Lang::init_words(const Str& definitions) {
  auto split_words = util::split(definitions, '\n');
  util::map_in_place<Str>(split_words, util::trim);
  split_words =
      util::filter<Str>(split_words, [](const auto& s) { return !s.empty(); });
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

int Lang::parse_sentence(const Str& sentence) {
  const auto origins = util::split_whitespace(sentence);
  const auto temp_words = util::map<Str, Str>(origins, [&](const auto& origin) {
    if (const auto match = words.find(origin); match != this->words.end()) {
      return match->second;
    } else {
      return Str("");
    }
  });
  const auto words =
      util::filter<Str>(temp_words, [](const auto& s) { return !s.empty(); });
  const auto n = words.size();

  // Check for and report unknown words
  if (n != origins.size()) {
    cerr << "Unknown words:" << std::endl;
    for (const auto& invalid : origins) {
      if (this->words.find(invalid) == this->words.end()) {
        cerr << "Not a word: '" << invalid << "'" << std::endl;
      }
    }
    return 0;
  }

  Vec<unordered_map<Str, CYKIntermediate>> matrix{n * n};
  std::generate(matrix.begin(), matrix.end(),
                []() { return unordered_map<Str, CYKIntermediate>(); });

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
        const Word word_val{word, origin};
        const CYKIntermediate val{word_val};
        map.insert({key, word_val});
      }
    } else {
      cerr << "Unusable word " << word << std::endl;
      return 0;
    }
    ++s;
  }

  // Execute CYK algorithm
  for (size_t l = 2; l <= n; ++l) {
    for (size_t s = 1; s <= n - l + 1; ++s) {
      for (size_t p = 1; p < l; ++p) {
        const auto l_ind = index2(n, n, p - 1, s - 1);
        auto& left = matrix[l_ind];
        const auto r_ind = index2(n, n, l - p - 1, s + p - 1);
        auto& right = matrix[r_ind];
        const auto insert_ind = index2(n, n, l - 1, s - 1);
        cyk_add_pairs_to_matrix(pairs, matrix, left, right, l_ind, r_ind,
                                insert_ind);
      }
    }
  }

  // Derive a sentence AST
  const auto& answer_table = matrix[index2(n, n, n - 1, 0)];
  if (const auto answer = answer_table.find("S");
      answer != answer_table.end()) {
    AST::AST* ast = derive_answer(matrix, answer->second);
    if (ast != NULL) {
      delete ast;
      return -1;
    }
  }
  return 0;
}

void cyk_add_pairs_to_matrix(unordered_map<Str, Vec<Str>> pairs,
                             Vec<unordered_map<Str, CYKIntermediate>>& matrix,
                             unordered_map<Str, CYKIntermediate>& left,
                             unordered_map<Str, CYKIntermediate>& right,
                             size_t l_ind, size_t r_ind, size_t insert_ind) {
  for (const auto& l_val : left) {
    for (const auto& r_val : right) {
      const auto pair = key_of_pair(l_val.first, r_val.first);
      if (const auto derivations = pairs.find(pair);
          derivations != pairs.end()) {
        for (const auto& rule_type : derivations->second) {
          const Derivation derivation{l_val.first, r_val.first, l_ind, r_ind};
          const CYKIntermediate val{derivation};
          matrix[insert_ind].insert({rule_type, derivation});
        }
      }
    }
  }
}

AST::AST* derive_answer(const Vec<unordered_map<Str, CYKIntermediate>>& matrix,
                        const CYKIntermediate& answer) {
  if (answer.type == CYKIntermediate::Type::WORD) {
    const AST::Word ret{answer.value.word.word, answer.value.word.origin};
    return new AST::AST(ret);
  } else if (answer.type == CYKIntermediate::Type::DERIVATION) {
    const auto& derivation = answer.value.derivation;
    const auto& m_left = matrix[derivation.left_index];
    const auto& m_right = matrix[derivation.right_index];
    const auto pair_l_val = m_left.find(derivation.left_symbol);
    const auto pair_r_val = m_right.find(derivation.right_symbol);
    if (pair_l_val == m_left.end() || pair_r_val == m_right.end()) {
      return NULL;
    }

    const auto& l_val = pair_l_val->second;
    const auto& r_val = pair_r_val->second;
    auto* lDerivation = derive_answer(matrix, l_val);
    if (lDerivation == NULL) {
      return NULL;
    }

    auto* rDerivation = derive_answer(matrix, r_val);
    if (rDerivation == NULL) {
      return NULL;
    }

    AST::Tagged rTagged{derivation.right_symbol, rDerivation};
    const auto rAnswer = new AST::AST(rTagged);

    // Handle N-Pair
    if (is_intermediate_rule_symbol(derivation.left_symbol) &&
        lDerivation->type == AST::AST::Type::RULE) {
      Vec<AST::AST*> ans = lDerivation->deleteAndClaimRule();
      ans.push_back(rAnswer);
      return new AST::AST(ans);
    }

    // Normal 2-Pair rule
    AST::Tagged lTagged{derivation.left_symbol, lDerivation};
    const auto lAnswer = new AST::AST(lTagged);
    Vec<AST::AST*> ans;
    ans.push_back(lAnswer);
    ans.push_back(rAnswer);
    return new AST::AST(ans);
  }

  return NULL;
}

static inline size_t index2(size_t dimX, size_t dimY, size_t x, size_t y) {
  if (x >= dimX || y >= dimY) {
    cerr << "indexing broke" << std::endl;
    return 0;
  }
  return x + y * dimX;
}
