#pragma once
#include <iterator>
#include <sstream>
#include <string>
#include <vector>

namespace util {
std::vector<std::string> split_whitespace(std::string white_string) {
  std::istringstream stream(white_string);
  std::vector<std::string> result(std::istream_iterator<std::string>{stream},
                                  std::istream_iterator<std::string>());
  return result;
}
}  // namespace util
