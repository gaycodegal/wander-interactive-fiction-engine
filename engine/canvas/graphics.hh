#pragma once

#include <memory>

#include "sdl_deleter.hh"

namespace canvas {

class Graphics {
 public:
  static inline void Release() {
    delete m_instance;
    m_instance = nullptr;

    m_initialized = false;
  }

  static inline Graphics *Instance(Str title) {
    if (!m_instance) {
      m_instance = new Graphics(title);
    }

    return m_instance;
  }

  static inline bool Initialized() { return m_initialized; }

  inline void ClearBackBuffer() { SDL_RenderClear(this->m_renderer.get()); }
  inline void DrawTexture(std::unique_ptr<SDL_Texture, sdl_deleter> text,
                          std::unique_ptr<SDL_Rect> clip = nullptr,
                          std::unique_ptr<SDL_Rect> rend = nullptr,
                          float angle = 0.0f,
                          SDL_RendererFlip flip = SDL_FLIP_NONE) {
    SDL_RenderCopyEx(this->m_renderer.get(), text.get(), clip.get(), rend.get(),
                     angle, nullptr, flip);
  }
  inline void Render() { SDL_RenderPresent(this->m_renderer.get()); }
  inline void Resize(int32_t width, int32_t height) {
    this->m_width = width;
    this->m_height = height;
  }

  std::unique_ptr<SDL_Texture, sdl_deleter> LoadTexture(std::string path);
  std::unique_ptr<SDL_Texture, sdl_deleter> CreateTextTexture(
      std::unique_ptr<TTF_Font> font, std::string text, SDL_Color color);

 private:
  Graphics(Str title);
  ~Graphics();

  bool Init(Str title);

  static Graphics *m_instance;
  static bool m_initialized;

  int32_t m_width{600};
  int32_t m_height{400};

  std::unique_ptr<SDL_Window, sdl_deleter> m_window;
  std::unique_ptr<SDL_Surface, sdl_deleter> m_surface;
  std::unique_ptr<SDL_Renderer, sdl_deleter> m_renderer;
};

}  // namespace canvas