#pragma once
#include <algorithm>
#include <functional>
#include <iterator>

#include "types.hh"

namespace util {
template <typename T>
Vec<T> filter(const Vec<T>& vec, std::function<bool(const T&)> predicate) {
  Vec<T> result;
  std::copy_if(vec.begin(), vec.end(), std::back_inserter(result), predicate);
  return result;
}

template <typename P, typename Q>
Vec<Q> map(const Vec<P>& vec, std::function<Q(const P&)> transformation) {
  Vec<Q> result(vec.size());
  std::transform(vec.begin(), vec.end(), result.begin(), transformation);
  return result;
}

template <typename P>
Vec<P>& map_in_place(Vec<P>& vec, std::function<void(P&)> transformation) {
  for (auto& item : vec) {
    transformation(item);
  }
  return vec;
}
}  // namespace util
