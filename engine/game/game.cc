#include <iostream>
#include <memory>

#include "audio_manager.hh"
#include "input_manager.hh"
#define SOL_ALL_SAFETIES_ON 1

using namespace std;

int main() {
  cout << "hello world!" << endl;
  bool test = true;
  canvas::Graphics& g = canvas::Graphics::Instance();
  canvas::InputManager& im = canvas::InputManager::Instance();

  while (test) {
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

    auto mPos = im.MousePos();
    printf("x: %f, y: %f\n", std::get<0>(mPos), std::get<1>(mPos));

    g.ClearBackBuffer();
    g.Render();
  }

  return 0;
}