#pragma once

#include <unordered_map>

#include "graphics.hh"

namespace canvas {
class AssetManager {
 public:
  static AssetManager* Instance();
  static void Release();

	std::unique_ptr<SDL_Texture, sdl_deleter> GetTexture(Str filename);
  std::unique_ptr<SDL_Texture, sdl_deleter> GetText(Str text, Str filename, int size, SDL_Color color);

  std::unique_ptr<Mix_Music, sdl_deleter> GetMusic(Str filename);
  std::unique_ptr<Mix_Chunk, sdl_deleter> GetSFX(Str filename);

 private:
  static AssetManager m_instance;
  std::unordered_map<Str, std::unique_ptr<SDL_Texture, sdl_deleter>>
      m_textures;
  std::unordered_map<Str, std::unique_ptr<SDL_Texture, sdl_deleter>>
      m_texts;
  std::unordered_map<Str, std::unique_ptr<TTF_Font, sdl_deleter>>
      m_fonts;
  std::unordered_map<Str, std::unique_ptr<Mix_Music, sdl_deleter>>
      m_music;
  std::unordered_map<Str, std::unique_ptr<Mix_Chunk, sdl_deleter>>
      m_SFX;

  AssetManager();
  ~AssetManager();

  std::unique_ptr<TTF_Font, sdl_deleter> GetFont(Str filename, int size);
};
}  // namespace canvas