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

std::vector<std::string> split(std::string whole_string, char sep) {
  std::istringstream stream(whole_string);
  std::vector<std::string> result;
  std::string temp;
  while (std::getline(stream, temp, sep)) {
    result.push_back(temp);
  }
  return result;
}
}  // namespace util
