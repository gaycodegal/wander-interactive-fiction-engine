#pragma once

#include <unordered_map>

#include "graphics.hh"

namespace canvas {
class AssetManager final : public MagicStatic<AssetManager> {
 public:
  SDL_Texture& GetTexture(Str filename);
  SDL_Texture& GetText(Str text, Str filename, int size, SDL_Color color);

  Mix_Music& GetMusic(Str filename);
  Mix_Chunk& GetSFX(Str filename);

 private:
  friend class MagicStatic<AssetManager>;

  AssetManager() {}
  ~AssetManager() {}
  
  std::unordered_map<Str, std::unique_ptr<SDL_Texture, sdl_deleter>> m_textures;
  std::unordered_map<Str, std::unique_ptr<SDL_Texture, sdl_deleter>> m_texts;
  std::unordered_map<Str, std::unique_ptr<TTF_Font, sdl_deleter>> m_fonts;
  std::unordered_map<Str, std::unique_ptr<Mix_Music, sdl_deleter>> m_music;
  std::unordered_map<Str, std::unique_ptr<Mix_Chunk, sdl_deleter>> m_SFX;

  TTF_Font& GetFont(Str filename, int size);
};
}  // namespace canvas
