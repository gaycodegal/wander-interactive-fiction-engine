#include "gmock/gmock.h"
#include "gtest/gtest.h"
#include "util.hh"

namespace {

TEST(Filter, FiltersOddNumbers) {
  Vec<int> v1{1, 2, 3, 4, 5};
  Vec<int> v2{2, 3, 4, 5, 6};
  auto filtered =
      util::filter<int>(v1, [](const auto& a) { return a % 2 == 1; });
  EXPECT_THAT(filtered, testing::ElementsAre(1, 3, 5));
  filtered = util::filter<int>(v2, [](const auto& a) { return a % 2 == 1; });
  EXPECT_THAT(filtered, testing::ElementsAre(3, 5));
}

TEST(Filter, FiltersEmpty) {
  Vec<int> v{};
  auto filtered =
      util::filter<int>(v, [](const auto& a) { return a % 2 == 1; });
  ASSERT_EQ(0, filtered.size());
}

TEST(Filter, FiltersSingleElement) {
  Vec<int> v1{7};
  Vec<int> v2{10};
  auto filtered =
      util::filter<int>(v1, [](const auto& a) { return a % 2 == 1; });
  EXPECT_THAT(filtered, testing::ElementsAre(7));
  filtered = util::filter<int>(v2, [](const auto& a) { return a % 2 == 1; });
  EXPECT_EQ(0, filtered.size());
}

TEST(Filter, FiltersStrings) {
  Vec<Str> v{"one", "", "cat", "", "is", "me"};
  auto filtered =
      util::filter<Str>(v, [](const auto& a) { return a.size() > 0; });
  EXPECT_THAT(filtered, testing::ElementsAre("one", "cat", "is", "me"));
}

TEST(Map, DoublesNumbers) {
  Vec<int> v{1, 2, 3, 4, 5};
  auto transformed =
      util::map<int, int>(v, [](const auto& a) { return a * 2; });
  EXPECT_THAT(transformed, testing::ElementsAre(2, 4, 6, 8, 10));
}

TEST(Map, DoublesSingleElement) {
  Vec<int> v{1};
  auto transformed =
      util::map<int, int>(v, [](const auto& a) { return a * 2; });
  EXPECT_THAT(transformed, testing::ElementsAre(2));
}

TEST(Map, HandlesEmpty) {
  Vec<int> v{};
  auto transformed =
      util::map<int, int>(v, [](const auto& a) { return a * 2; });
  ASSERT_EQ(0, transformed.size());
}

TEST(Map, HandlesStrings) {
  Vec<Str> v{"one", "", "is", "me"};
  auto transformed =
      util::map<Str, Str>(v, [](const auto& a) { return "new"; });
  EXPECT_THAT(transformed, testing::ElementsAre("new", "new", "new", "new"));
}

TEST(Map, ConvertsTypes) {
  Vec<int> v{1, 32, -3};
  auto transformed =
      util::map<int, Str>(v, [](const auto& a) { return std::to_string(a); });
  EXPECT_THAT(transformed, testing::ElementsAre("1", "32", "-3"));
}

TEST(MapInPlace, Trims) {
  Vec<Str> v{"   test ", "  test2", "  ", ""};
  auto ret = util::map_in_place<Str>(v, util::trim);
  EXPECT_THAT(v, testing::ElementsAre("test", "test2", "", ""));
  EXPECT_THAT(ret, testing::ElementsAre("test", "test2", "", ""));
}
}  // namespace
