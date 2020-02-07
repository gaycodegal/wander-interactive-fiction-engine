#include "split.hh"
#include <vector>
#include "gmock/gmock.h"
#include "gtest/gtest.h"

namespace {

TEST(SplitWhitespace, HandlesNormalInput) {
  std::string t1 = "this is a test";
  std::string t2 = " this    is  a test ";
  auto split = util::split_whitespace(t1);
  EXPECT_THAT(split, testing::ElementsAre("this", "is", "a", "test"));
  split = util::split_whitespace(t2);
  EXPECT_THAT(split, testing::ElementsAre("this", "is", "a", "test"));
}

TEST(SplitWhitespace, SplitsEmpty) {
  std::string t1 = "";
  std::string t2 = " ";
  auto split = util::split_whitespace(t1);
  EXPECT_EQ(0, split.size());
  split = util::split_whitespace(t2);
  EXPECT_EQ(0, split.size());
}

TEST(SplitWhitespace, SplitsSingleElement) {
  std::string t = "hi";
  auto split = util::split_whitespace(t);
  EXPECT_THAT(split, testing::ElementsAre("hi"));
}

TEST(Split, HandlesNormalInput) {
  std::string t1 = "this, is,a ,test";
  std::string t2 = ",this,,is,a,test,";
  auto split = util::split(t1, ',');
  EXPECT_THAT(split, testing::ElementsAre("this", " is", "a ", "test"));
  split = util::split(t2, ',');
  EXPECT_THAT(split, testing::ElementsAre("", "this", "", "is", "a", "test"));
}

TEST(Split, SplitsEmpty) {
  std::string t = "";
  auto split = util::split(t, ',');
  EXPECT_EQ(0, split.size());
}

TEST(Split, SplitsSingleElement) {
  std::string t = "hi";
  auto split = util::split(t, ',');
  EXPECT_THAT(split, testing::ElementsAre("hi"));
}

}  // namespace