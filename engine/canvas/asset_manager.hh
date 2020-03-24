#pragma once

#include <unordered_map>

#include "graphics.hh"

namespace canvas {
class AssetManager {
 public:
  ~AssetManager() {}

  static inline AssetManager& Instance() {
    if (!m_instance) {
      m_instance.reset(new AssetManager());
    }

    return *m_instance.get();
  }

  SDL_Texture& GetTexture(Str filename);
  SDL_Texture& GetText(Str text, Str filename, int size, SDL_Color color);

  Mix_Music& GetMusic(Str filename);
  Mix_Chunk& GetSFX(Str filename);

 private:
  static std::unique_ptr<AssetManager> m_instance;

  std::unordered_map<Str, std::unique_ptr<SDL_Texture, sdl_deleter>> m_textures;
  std::unordered_map<Str, std::unique_ptr<SDL_Texture, sdl_deleter>> m_texts;
  std::unordered_map<Str, std::unique_ptr<TTF_Font, sdl_deleter>> m_fonts;
  std::unordered_map<Str, std::unique_ptr<Mix_Music, sdl_deleter>> m_music;
  std::unordered_map<Str, std::unique_ptr<Mix_Chunk, sdl_deleter>> m_SFX;

  AssetManager() {}

  TTF_Font& GetFont(Str filename, int size);
};
}  // namespace canvas