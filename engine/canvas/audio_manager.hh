#pragma once

#include "asset_manager.hh"

namespace canvas {

class AudioManager {
 public:
  ~AudioManager() {}

  static AudioManager& Instance() {
    if (!m_instance) {
      m_instance.reset(new AudioManager());
    }

    return *m_instance.get();
  }

  void inline PlayMusic(Str filename, int loops = -1) {
    Mix_PlayMusic(&this->m_AssetMgr->GetMusic(filename), loops);
  }
  void inline PauseMusic() { if (Mix_PlayingMusic()) Mix_PauseMusic(); }
  void inline ResumeMusic() { if (Mix_PausedMusic()) Mix_ResumeMusic(); }

  void inline PlaySFX(Str filename, int loops = 0, int channel = 0) {
    Mix_PlayChannel(channel, &this->m_AssetMgr->GetSFX(filename), loops);
  }
	void inline PauseSFX(int channel = 0) { if (Mix_Playing(channel)) Mix_Pause(channel); }
  void inline ResumeSFX(int channel = 0) { if (Mix_Paused(channel)) Mix_Resume(channel); }

 private:
  static std::unique_ptr<AudioManager> m_instance;

  AssetManager *m_AssetMgr;

  AudioManager();
};

}  // namespace canvas