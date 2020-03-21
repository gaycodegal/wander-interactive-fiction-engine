#include "graphics.hh"

std::unique_ptr<canvas::Graphics, canvas::DestroyGraphics>
    canvas::Graphics::sInstance = nullptr;
bool canvas::Graphics::sInitialized = false;

/* std::unique_ptr<canvas::Graphics, canvas::DestroyGraphics>
canvas::Graphics::Instance(Str title) { if(!sInstance) { sInstance =
std::make_unique<canvas::Graphics>(title);
  }

  return sInstance;
} */