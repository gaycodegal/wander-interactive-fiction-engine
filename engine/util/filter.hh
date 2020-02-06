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

template <typename P, typename Q>
std::vector<Q> map(std::vector<P> vec,
                   std::function<Q(const P&)> transformation) {
  std::vector<Q> result(vec.size());
  std::transform(vec.begin(), vec.end(), result.begin(), transformation);
  return result;
}
}  // namespace util
