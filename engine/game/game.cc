#include <iostream>
#include <memory>

#include "engine/sdl/sdl_include.hh"
#include "entt.hh"
#define SOL_ALL_SAFETIES_ON 1
#include "querier.hh"
#include "sol.hpp"

using namespace std;

struct sdl_deleter {
  void operator()(SDL_Window* p) const { SDL_DestroyWindow(p); }
  // void operator()(SDL_Renderer *p) const { SDL_DestroyRenderer(p); }
  // void operator()(SDL_Texture *p) const { SDL_DestroyTexture(p); }
};

int main() {
  vector<string> attrs = {"green"};
  vector<string> comps = {"heals"};
  models::Item i("apple", "A delicious red apple.", "red,fruit,edible", {});
  json j = i;
  cout << "json Item: " << j.dump(4) << endl;
  auto item = j.get<models::Item>();
  cout << "json back to Item class: " << item << endl;

  std::unique_ptr<Querier> q = std::make_unique<Querier>("/tmp/test.db");
  q->insert_item(item);
  // auto i2 = q->get_item("apple");
  // cout << "retrieved: " << i2 << endl;

  // q->dump_from_file("/tmp/test_dump_json.json");
  auto items = q->query_items({}, attrs, comps);
  cout << "size of: " << items.size() << endl;
  for (const auto& item : items) {
    cout << "item: " << item.name << endl;
  }

  SDL_Init(SDL_INIT_VIDEO);

  unique_ptr<SDL_Window, sdl_deleter> window(
      SDL_CreateWindow("An SDL2 window", SDL_WINDOWPOS_UNDEFINED,
                       SDL_WINDOWPOS_UNDEFINED, 640, 480, SDL_WINDOW_OPENGL));

  // Check that the window was successfully created
  if (window == nullptr) {
    // In the case that the window could not be made...
    printf("Could not create window: %s\n", SDL_GetError());
    return 1;
  }

  SDL_Delay(300);

  SDL_Quit();

  return 0;
}