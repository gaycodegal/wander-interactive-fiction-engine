#include <iostream>
#include <memory>

#include "audio_manager.hh"
#define SOL_ALL_SAFETIES_ON 1

using namespace std;

int main() {
  cout << "hello world!" << endl;
  canvas::Graphics& g = canvas::Graphics::Instance();
  g.Render();
  return 0;
}