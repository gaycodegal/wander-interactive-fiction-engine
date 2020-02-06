#include "lang.hh"

#include "gtest/gtest.h"

namespace {

TEST(Lang, ParseSentence_Exists) {
  auto lang = cfg::Lang();
  EXPECT_EQ(-1, lang.parse_sentence("eat a clean apple"));
}

}  // namespace
