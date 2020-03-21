#include "graphics.hh"

std::unique_ptr<canvas::Graphics, canvas::Graphics::DestroyGraphics> canvas::Graphics::sInstance = nullptr;
bool canvas::Graphics::sInitialized = false;