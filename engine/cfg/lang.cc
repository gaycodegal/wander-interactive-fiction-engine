#include "lang.hh"

using namespace cfg;

int Lang::parse_sentence(std::string sentence) {
  auto origins = util::split_whitespace(sentence);
  auto temp_words =
      util::map<std::string, std::string>(origins, [&](auto origin) {
        auto match = words.find(origin);
        if (match == words.end()) {
          return std::string("");
        } else {
          return match->second;
        }
      });
  auto words =
      util::filter<std::string>(temp_words, [](auto s) { return !s.empty(); });
  auto n = words.size();
  if (n != origins.size()) {
    return -1;
  }

  return 0;
}

/**
 * Parses and initializes up the Lang's rules.

int Lang::init_rules(std::string rules) {
    let split_rules = util::split_whitespace(rules);
    for rule in split_rules {
        let mut parts = rule.split(":");
        let rule_type = parts.next();
        let values = parts.next();
        if parts.next() != None {
            eprintln!("[Ignored] Badly formatted rule \"{}\"", rule);
            continue;
        }

        if let (&Some(rule_type), &Some(values)) =
            (&rule_type.as_ref(), &values.as_ref())
        {
            let values = values.split("|");
            for value in values {
                self.parseRuleValue(rule_type, value);
            }
        } else {
            eprintln!("[Ignored] Badly formatted rule \"{}\"", rule);
        }
    }
}
*/
