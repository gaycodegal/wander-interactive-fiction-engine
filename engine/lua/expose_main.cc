#include "expose.hh"
#include <filesystem>
#include <fstream>
#include <sstream>
#include <iostream>

namespace fs = std::filesystem;

Str read_file(fs::path path) {
  std::ifstream file{path};
  const auto size = std::filesystem::file_size(path);
  Str result(size, ' ');
  file.read(result.data(), size);
  return result;
}

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cout << "arg1: lua file name" << std::endl;
    return 1;
  }
  sol::state lua;
  lua.open_libraries(sol::lib::base, sol::lib::io);
  expose_to_lua(lua);
  Str file = read_file(argv[1]);
  lua.script(file);
  return 0;
}
