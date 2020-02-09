#include "gmock/gmock.h"
#include "gtest/gtest.h"
#include "util.hh"

namespace {

TEST(SplitWhitespace, HandlesNormalInput) {
  Str t1 = "this is a test";
  Str t2 = " this    is  a test ";
  auto split = util::split_whitespace(t1);
  EXPECT_THAT(split, testing::ElementsAre("this", "is", "a", "test"));
  split = util::split_whitespace(t2);
  EXPECT_THAT(split, testing::ElementsAre("this", "is", "a", "test"));
}

TEST(SplitWhitespace, SplitsEmpty) {
  Str t1 = "";
  Str t2 = " ";
  auto split = util::split_whitespace(t1);
  EXPECT_EQ(0, split.size());
  split = util::split_whitespace(t2);
  EXPECT_EQ(0, split.size());
}

TEST(SplitWhitespace, SplitsSingleElement) {
  Str t = "hi";
  auto split = util::split_whitespace(t);
  EXPECT_THAT(split, testing::ElementsAre("hi"));
}

TEST(Split, HandlesNormalInput) {
  Str t1 = "this, is,a ,test";
  Str t2 = ",this,,is,a,test,";
  auto split = util::split(t1, ',');
  EXPECT_THAT(split, testing::ElementsAre("this", " is", "a ", "test"));
  split = util::split(t2, ',');
  EXPECT_THAT(split, testing::ElementsAre("", "this", "", "is", "a", "test"));
}

TEST(Split, SplitsEmpty) {
  Str t = "";
  auto split = util::split(t, ',');
  EXPECT_EQ(0, split.size());
}

TEST(Split, SplitsSingleElement) {
  Str t = "hi";
  auto split = util::split(t, ',');
  EXPECT_THAT(split, testing::ElementsAre("hi"));
}

TEST(Trim, HandlesNormalInput) {
  Str t1 = "this is a test";
  Str t2 = " this    is  a test \n ";
  util::trim(t1);
  EXPECT_EQ(t1, "this is a test");
  util::trim(t2);
  EXPECT_EQ(t2, "this    is  a test");
}

TEST(Trim, SplitsEmpty) {
  Str t1 = "";
  Str t2 = " ";
  util::trim(t1);
  EXPECT_EQ(t1, "");
  util::trim(t2);
  EXPECT_EQ(t2, "");
}

}  // namespace
