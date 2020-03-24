#pragma once

#include <memory>
#include <vector>

#include "sdl_deleter.hh"

namespace canvas {
class InputManager {
 public:
  ~InputManager() {}

  enum MOUSE_BUTTON { left = 0, right, middle, back, forward };

  static inline InputManager& Instance() {
    if (!m_instance) {
      m_instance.reset(new InputManager());
    }

    return *m_instance.get();
  }

  inline bool KeyDown(SDL_Scancode scanCode) {
    return this->m_KeyboardState[scanCode];
  }
  inline bool KeyPressed(SDL_Scancode scanCode) {
    return !this->m_PrevKeyboardState[scanCode] &&
           this->m_KeyboardState[scanCode];
  }
  inline bool KeyReleased(SDL_Scancode scanCode) {
    return this->m_PrevKeyboardState[scanCode] &&
           !this->m_KeyboardState[scanCode];
  }

  bool MouseButtonDown(MOUSE_BUTTON button);
  bool MouseButtonPressed(MOUSE_BUTTON button);
  bool MouseButtonReleased(MOUSE_BUTTON button);

  std::tuple<float, float> MousePos();

  inline void Update() {
    this->m_MouseState =
        SDL_GetMouseState(&this->m_MouseXPos, &this->m_MouseYPos);
  }
  void UpdatePrevInput() {
    memcpy(this->m_PrevKeyboardState, this->m_KeyboardState, this->m_KeyLength);
    this->m_PrevMouseState = this->m_MouseState;
  }

 private:
  static std::unique_ptr<InputManager> m_instance;

  Uint8* m_PrevKeyboardState;
  const Uint8* m_KeyboardState;
  int m_KeyLength;

  Uint32 m_PrevMouseState;
  Uint32 m_MouseState;

  int m_MouseXPos;
  int m_MouseYPos;

  InputManager();
};
}  // namespace canvas