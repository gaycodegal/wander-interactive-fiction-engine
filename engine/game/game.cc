#include <iostream>
#include <memory>
#include <vector>

#include "engine/querier/querier.hh"
#include "engine/sdl/sdl_include.hh"

using namespace std;

struct sdl_deleter {
  void operator()(SDL_Window *p) const { SDL_DestroyWindow(p); }
  // void operator()(SDL_Renderer *p) const { SDL_DestroyRenderer(p); }
  // void operator()(SDL_Texture *p) const { SDL_DestroyTexture(p); }
};

int main() {
  // vector<string> attrs = {"test", "monkey", "more", "words", "for", "test"};
  

  models::Item i("apple", "A delicious red apple.", "red,fruit,edible", {});
  json j = i;
  cout << "json Item: " << j << endl;
  auto item = j.get<models::Item>();
  cout << "name of item json back to Item class: " << item.name << endl;

  std::unique_ptr<Querier> q =  std::make_unique<Querier>("/tmp/test.db");
  // auto i2 = q->get_item(item.name);
  
  q->dump_from_file("/tmp/test_dump_json.json");
  auto items = q->query_items({}, {}, {});
  cout << "what: " << items.size() << endl;
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

  SDL_Delay(3000);

  SDL_Quit();

  return 0;
}