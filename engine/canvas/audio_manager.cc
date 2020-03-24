#include "audio_manager.hh"

std::unique_ptr<canvas::AudioManager> canvas::AudioManager::m_instance =
    nullptr;

canvas::AudioManager::AudioManager() {
  this->m_AssetMgr = &canvas::AssetManager::Instance();

  if (Mix_OpenAudio(44100, MIX_DEFAULT_FORMAT, 2, 4096) < 0) {
    printf("Mixer Init Error: %s\n", Mix_GetError());
  }
}
