#include <iostream>
#include <memory>

#include "asset_manager.hh"
#include "graphics.hh"
#define SOL_ALL_SAFETIES_ON 1

using namespace std;

int main() {
  cout << "hello world!" << endl;
  canvas::Graphics *g = canvas::Graphics::Instance("Game");
  g->Render();
  return 0;
}