#include "filter.hh"
#include <vector>
#include "gmock/gmock.h"
#include "gtest/gtest.h"

namespace {

TEST(Filter, FiltersOddNumbers) {
  std::vector<int> v1{1, 2, 3, 4, 5};
  std::vector<int> v2{2, 3, 4, 5, 6};
  auto filtered = util::filter<int>(v1, [](auto a) { return a % 2 == 1; });
  EXPECT_THAT(filtered, testing::ElementsAre(1, 3, 5));
  filtered = util::filter<int>(v2, [](auto a) { return a % 2 == 1; });
  EXPECT_THAT(filtered, testing::ElementsAre(3, 5));
}

TEST(Filter, FiltersEmpty) {
  std::vector<int> v{};
  auto filtered = util::filter<int>(v, [](auto a) { return a % 2 == 1; });
  ASSERT_EQ(0, filtered.size());
}

TEST(Filter, FiltersSingleElement) {
  std::vector<int> v1{7};
  std::vector<int> v2{10};
  auto filtered = util::filter<int>(v1, [](auto a) { return a % 2 == 1; });
  EXPECT_THAT(filtered, testing::ElementsAre(7));
  filtered = util::filter<int>(v2, [](auto a) { return a % 2 == 1; });
  EXPECT_EQ(0, filtered.size());
}

TEST(Filter, FiltersStrings) {
  std::vector<std::string> v{"one", "", "cat", "", "is", "me"};
  auto filtered =
      util::filter<std::string>(v, [](auto a) { return a.size() > 0; });
  EXPECT_THAT(filtered, testing::ElementsAre("one", "cat", "is", "me"));
}

}  // namespace
