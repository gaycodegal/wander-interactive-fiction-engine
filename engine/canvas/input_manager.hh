#pragma once

#include <memory>
#include <vector>

#include "sdl_deleter.hh"

namespace canvas {
  class InputManager {
  public:
    InputManager(const InputManager&) = delete;
    InputManager& operator=(const InputManager &) = delete;
    InputManager(InputManager &&) = delete;
    InputManager & operator=(InputManager &&) = delete;

    static InputManager& Instance();
    
    ~InputManager() {}

    enum MOUSE_BUTTON { left = 0, right, middle, back, forward };

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
      memcpy(this->m_PrevKeyboardState.get(), this->m_KeyboardState, this->m_KeyLength);
      this->m_PrevMouseState = this->m_MouseState;
    }

  private:
    std::unique_ptr<Uint8[]> m_PrevKeyboardState;
    const Uint8* m_KeyboardState;
    int m_KeyLength;

    Uint32 m_PrevMouseState;
    Uint32 m_MouseState;

    int m_MouseXPos;
    int m_MouseYPos;

    InputManager();
  };

}  // namespace canvas
