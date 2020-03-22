#pragma once

#include "sdl_include.hh"
#include "types.hh"

namespace canvas {
struct sdl_deleter {
  void operator()(SDL_Window *p) const { SDL_DestroyWindow(p); }
  void operator()(SDL_Renderer *p) const { SDL_DestroyRenderer(p); }
  void operator()(SDL_Texture *p) const { SDL_DestroyTexture(p); }
  void operator()(SDL_Surface *p) const { delete p; }
  void operator()(TTF_Font *p) const { TTF_CloseFont(p); }
  void operator()(Mix_Music *p) const { Mix_FreeMusic(p); }
  void operator()(Mix_Chunk *p) const { Mix_FreeChunk(p); }
};
}  // namespace canvas