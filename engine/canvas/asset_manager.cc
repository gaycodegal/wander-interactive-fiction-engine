#include "asset_manager.hh"

std::unique_ptr<canvas::AssetManager> canvas::AssetManager::m_instance =
    nullptr;

SDL_Texture& canvas::AssetManager::GetTexture(Str filename) {
  Str fullPath = SDL_GetBasePath();
  fullPath.append("Assets/" + filename);

  if (!this->m_textures[fullPath]) {
    this->m_textures[fullPath] =
        canvas::Graphics::Instance().LoadTexture(fullPath);
  }

  return *this->m_textures[fullPath].get();
}

SDL_Texture& canvas::AssetManager::GetText(Str text, Str filename, int size,
                                           SDL_Color color) {
  TTF_Font& font = GetFont(filename, size);

  Str key = text + filename + (char)size + (char)color.r + (char)color.b +
            (char)color.g;
  if (!this->m_texts[key]) {
    this->m_texts[key] =
        canvas::Graphics::Instance().CreateTextTexture(&font, text, color);
  }

  return *this->m_texts[key].get();
}

Mix_Music& canvas::AssetManager::GetMusic(Str filename) {
  Str fullPath = SDL_GetBasePath();
  fullPath.append("Assets/" + filename);

  if (!this->m_music[fullPath]) {
    this->m_music[fullPath].reset(Mix_LoadMUS(fullPath.c_str()));

    if (!this->m_music[fullPath]) {
      printf("Music Load Error: File(%s) - Error(%s)\n", filename.c_str(),
             Mix_GetError());
    }
  }

  return *this->m_music[fullPath].get();
}

Mix_Chunk& canvas::AssetManager::GetSFX(Str filename) {
  Str fullPath = SDL_GetBasePath();
  fullPath.append("Assets/" + filename);

  if (!this->m_SFX[fullPath]) {
    this->m_SFX[fullPath].reset(Mix_LoadWAV(fullPath.c_str()));

    if (!this->m_SFX[fullPath]) {
      printf("Music Load Error: File(%s) - Error(%s)\n", filename.c_str(),
             Mix_GetError());
    }
  }

  return *this->m_SFX[fullPath].get();
}

TTF_Font& canvas::AssetManager::GetFont(Str filename, int size) {
  Str fullPath = SDL_GetBasePath();
  fullPath.append("Assets/" + filename);

  Str key = fullPath + char(size);
  if (!this->m_fonts[key]) {
    this->m_fonts[key].reset(TTF_OpenFont(fullPath.c_str(), size));

    if (!this->m_fonts[key]) {
      printf("Font Loading Error: Font(%s) Error(%s)\n", filename.c_str(),
             TTF_GetError());
    }
  }

  return *this->m_fonts[key].get();
}