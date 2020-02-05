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
  // std::vector<string> attrs = { "test", "monkey" };
  Querier q(":memory:");
  q.query_items({}, {}, {});
  cout << "Hello, World!" << endl;

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