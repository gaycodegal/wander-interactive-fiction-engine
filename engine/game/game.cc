#include <iostream>

#include "audio_manager.hh"
#include "input_manager.hh"
#include "singleton.hh"
#define SOL_ALL_SAFETIES_ON 1

using namespace std;

struct MyContext;

int main() {
  bool test = true;
  SDL_Event mEvents;
  canvas::Graphics& g = canvas::Graphics::Instance();
  canvas::InputManager& im = canvas::InputManager::Instance();

  while (test) {
    while (SDL_PollEvent(&mEvents) != 0) {
      if (mEvents.type == SDL_QUIT) {
        test = false;
      }
    }

    im.Update();

    if (im.KeyReleased(SDL_SCANCODE_W)) {
      printf("W Key Released\n");
    }
    if (im.KeyPressed(SDL_SCANCODE_W)) {
      printf("W Key Pressed\n");
    }
    if (im.KeyDown(SDL_SCANCODE_W)) {
      printf("W Key Down\n");
    }

    if (im.KeyPressed(SDL_SCANCODE_S)) {
      test = false;
    }

    im.UpdatePrevInput();

    g.ClearBackBuffer();
    g.Render();
  }

  return 0;
}
