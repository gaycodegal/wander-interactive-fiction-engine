#include "lang.hh"

#include <filesystem>
#include <fstream>
#include <sstream>
#include <string>

#include "gtest/gtest.h"

namespace fs = std::filesystem;
namespace {

Str read_file(fs::path path) {
  std::ifstream file{path};
  const auto size = std::filesystem::file_size(path);
  Str result(size, ' ');
  file.read(result.data(), size);
  return result;
}

TEST(Lang, ParseSentence_Exists) {
  auto lang = cfg::Lang();
  auto rules = read_file("engine/cfg/test-lang-rules.txt");
  lang.init_rules(rules);
  auto words = read_file("engine/cfg/test-lang-words.txt");
  lang.init_words(words);
  Str sentence = "eat a clean apple";
  const auto* parsed = lang.parse_sentence(sentence, {"ActionSentence"});
  const auto* ast = parsed->ast;
  std::ostringstream ss;
  ss << *ast;
  delete parsed;
  EXPECT_EQ(
      "\n"
      "(RULE\n"
      "(TAGGED Verb, (WORD verb, eat))\n"
      "(TAGGED NounClause, \n"
      "(RULE\n"
      "(TAGGED Count, (WORD indefiniteArticle, a))\n"
      "(TAGGED ANoun, \n"
      "(RULE\n"
      "(TAGGED Adjective, (WORD adjective, clean))\n"
      "(TAGGED Noun, (WORD noun, apple))\n"
      "))\n"
      "))\n"
      ")",
      ss.str());
}

TEST(Lang, InitsRules) {
  auto lang = cfg::Lang();
  auto rules = read_file("engine/cfg/test-lang-rules.txt");
  lang.init_rules(rules);
}

}  // namespace
