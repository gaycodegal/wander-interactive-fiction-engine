#pragma once
#include <algorithm>
#include <cctype>
#include <iterator>
#include <locale>
#include <sstream>

#include "types.hh"

namespace util {
static inline Vec<Str> split_whitespace(const Str& white_string) {
  std::istringstream stream(white_string);
  Vec<Str> result(std::istream_iterator<Str>{stream},
                  std::istream_iterator<Str>());
  return result;
}

static inline Vec<Str> split(const Str& whole_string, char sep) {
  std::istringstream stream(whole_string);
  Vec<Str> result;
  Str temp;
  while (std::getline(stream, temp, sep)) {
    result.push_back(temp);
  }
  return result;
}

/**
   trim from the left of the string
 */
static inline Str& ltrim(Str& s) {
  s.erase(s.begin(), std::find_if(s.begin(), s.end(),
                                  [](int c) { return !std::isspace(c); }));
  return s;
}

/**
   trim from the right of the string
 */
static inline Str& rtrim(Str& s) {
  s.erase(
      std::find_if(s.rbegin(), s.rend(), [](int c) { return !std::isspace(c); })
          .base(),
      s.end());
  return s;
}

/**
   standard trim
 */
static inline Str& trim(Str& s) {
  ltrim(s);
  return rtrim(s);
}
}  // namespace util
