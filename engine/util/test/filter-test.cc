#include "filter.hh"
#include "split.hh"

#include <string>
#include <vector>

#include "gmock/gmock.h"
#include "gtest/gtest.h"

namespace {

TEST(Filter, FiltersOddNumbers) {
  std::vector<int> v1{1, 2, 3, 4, 5};
  std::vector<int> v2{2, 3, 4, 5, 6};
  auto filtered = util::filter<int>(v1, [](const auto& a) { return a % 2 == 1; });
  EXPECT_THAT(filtered, testing::ElementsAre(1, 3, 5));
  filtered = util::filter<int>(v2, [](const auto& a) { return a % 2 == 1; });
  EXPECT_THAT(filtered, testing::ElementsAre(3, 5));
}

TEST(Filter, FiltersEmpty) {
  std::vector<int> v{};
  auto filtered = util::filter<int>(v, [](const auto& a) { return a % 2 == 1; });
  ASSERT_EQ(0, filtered.size());
}

TEST(Filter, FiltersSingleElement) {
  std::vector<int> v1{7};
  std::vector<int> v2{10};
  auto filtered = util::filter<int>(v1, [](const auto& a) { return a % 2 == 1; });
  EXPECT_THAT(filtered, testing::ElementsAre(7));
  filtered = util::filter<int>(v2, [](const auto& a) { return a % 2 == 1; });
  EXPECT_EQ(0, filtered.size());
}

TEST(Filter, FiltersStrings) {
  std::vector<std::string> v{"one", "", "cat", "", "is", "me"};
  auto filtered =
      util::filter<std::string>(v, [](const auto& a) { return a.size() > 0; });
  EXPECT_THAT(filtered, testing::ElementsAre("one", "cat", "is", "me"));
}

TEST(Map, DoublesNumbers) {
  std::vector<int> v{1, 2, 3, 4, 5};
  auto transformed = util::map<int, int>(v, [](const auto& a) { return a * 2; });
  EXPECT_THAT(transformed, testing::ElementsAre(2, 4, 6, 8, 10));
}

TEST(Map, DoublesSingleElement) {
  std::vector<int> v{1};
  auto transformed = util::map<int, int>(v, [](const auto& a) { return a * 2; });
  EXPECT_THAT(transformed, testing::ElementsAre(2));
}

TEST(Map, HandlesEmpty) {
  std::vector<int> v{};
  auto transformed = util::map<int, int>(v, [](const auto& a) { return a * 2; });
  ASSERT_EQ(0, transformed.size());
}

TEST(Map, HandlesStrings) {
  std::vector<std::string> v{"one", "", "is", "me"};
  auto transformed =
      util::map<std::string, std::string>(v, [](const auto& a) { return "new"; });
  EXPECT_THAT(transformed, testing::ElementsAre("new", "new", "new", "new"));
}

TEST(Map, ConvertsTypes) {
  std::vector<int> v{1, 32, -3};
  auto transformed =
      util::map<int, std::string>(v, [](const auto& a) { return std::to_string(a); });
  EXPECT_THAT(transformed, testing::ElementsAre("1", "32", "-3"));
}

TEST(MapInPlace, Trims) {
  std::vector<std::string> v{"   test ", "  test2", "  ", ""};
  auto ret = util::map_in_place<std::string>(v, util::trim);
  EXPECT_THAT(v, testing::ElementsAre("test", "test2", "", ""));
  EXPECT_THAT(ret, testing::ElementsAre("test", "test2", "", ""));
}
}  // namespace
