#include "lang.hh"

#include <filesystem>
#include <fstream>
#include <string>

#include "gtest/gtest.h"

namespace fs = std::filesystem;
namespace {

std::string read_file(fs::path path) {
  std::ifstream file{path};
  const auto size = std::filesystem::file_size(path);
  std::string result(size, ' ');
  file.read(result.data(), size);
  return result;
}

TEST(Lang, ParseSentence_Exists) {
  auto lang = cfg::Lang();
  std::string sentence = "eat a clean apple";
  EXPECT_EQ(-1, lang.parse_sentence(sentence));
}

TEST(Lang, InitsRules) {
  auto lang = cfg::Lang();
  auto rules = read_file("engine/cfg/test-lang-rules.txt");
  lang.init_rules(rules);
}

}  // namespace
