#pragma once
#include <algorithm>
#include <functional>
#include <iterator>
#include <vector>

namespace util {
template <typename T>
std::vector<T> filter(std::vector<T> vec,
                      std::function<bool(const T&)> predicate) {
  std::vector<T> result;
  std::copy_if(vec.begin(), vec.end(), std::back_inserter(result), predicate);
  return result;
}
}  // namespace util
