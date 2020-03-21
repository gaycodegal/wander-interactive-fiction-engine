#pragma once

#include <memory>

#include "sdl_include.hh"
#include "types.hh"

namespace canvas {
void FreeSurface(SDL_Surface *surface) { delete surface; }

class Graphics {
 public:
  static void Release();
  Graphics *Instance(Str title);
  static bool Initialized();

  void ClearBackBuffer();
  void DrawTexture(std::unique_ptr<SDL_Texture> tex,
                   std::unique_ptr<SDL_Rect> clip = nullptr,
                   std::unique_ptr<SDL_Rect> rend = nullptr, float angle = 0.0f,
                   SDL_RendererFlip flip = SDL_FLIP_NONE);
  void Render();

  std::unique_ptr<SDL_Texture> LoadTexture(std::string path);
  std::unique_ptr<SDL_Texture> CreateTextTexture(std::unique_ptr<TTF_Font> font,
                                                 std::string text,
                                                 SDL_Color color);

 private:
  Graphics(Str title);
  ~Graphics();

  bool Init(Str title);

  static Graphics *m_instance;
  static bool m_initialized;

  int32_t m_width{600};
  int32_t m_height{400};

  std::unique_ptr<SDL_Window, decltype(&SDL_DestroyWindow)> m_window;
  std::unique_ptr<SDL_Surface, decltype(&FreeSurface)> m_surface;
  std::unique_ptr<SDL_Renderer, decltype(&SDL_DestroyRenderer)> m_renderer;
};

using DestroyGraphics = decltype(&Graphics::Release);
}  // namespace canvas