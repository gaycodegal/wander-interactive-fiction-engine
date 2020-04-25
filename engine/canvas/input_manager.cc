#include "input_manager.hh"
canvas::InputManager& canvas::InputManager::Instance() {
  static InputManager im;
  return im;
}

canvas::InputManager::InputManager() {
  this->m_KeyboardState = SDL_GetKeyboardState(&this->m_KeyLength);
  this->m_PrevKeyboardState = std::make_unique<Uint8[]>(this->m_KeyLength);
  memcpy(this->m_PrevKeyboardState.get(), this->m_KeyboardState, this->m_KeyLength);
}

bool canvas::InputManager::MouseButtonDown(MOUSE_BUTTON button) {
  Uint32 mask = 0;

  switch (button) {
    case left:
      mask = SDL_BUTTON_LMASK;
      break;

    case right:
      mask = SDL_BUTTON_RMASK;
      break;

    case middle:
      mask = SDL_BUTTON_MMASK;
      break;

    case back:
      mask = SDL_BUTTON_X1MASK;
      break;

    case forward:
      mask = SDL_BUTTON_X2MASK;
      break;
  }

  return (this->m_MouseState & mask);
}

bool canvas::InputManager::MouseButtonPressed(MOUSE_BUTTON button) {
  Uint32 mask = 0;

  switch (button) {
    case left:
      mask = SDL_BUTTON_LMASK;
      break;

    case right:
      mask = SDL_BUTTON_RMASK;
      break;

    case middle:
      mask = SDL_BUTTON_MMASK;
      break;

    case back:
      mask = SDL_BUTTON_X1MASK;
      break;

    case forward:
      mask = SDL_BUTTON_X2MASK;
      break;
  }

  return !(this->m_PrevMouseState & mask) && (this->m_MouseState & mask);
}

bool canvas::InputManager::MouseButtonReleased(MOUSE_BUTTON button) {
  Uint32 mask = 0;

  switch (button) {
    case left:
      mask = SDL_BUTTON_LMASK;
      break;

    case right:
      mask = SDL_BUTTON_RMASK;
      break;

    case middle:
      mask = SDL_BUTTON_MMASK;
      break;

    case back:
      mask = SDL_BUTTON_X1MASK;
      break;

    case forward:
      mask = SDL_BUTTON_X2MASK;
      break;
  }

  return (this->m_PrevMouseState & mask) && !(this->m_MouseState & mask);
}

std::tuple<float, float> canvas::InputManager::MousePos() {
  return std::make_tuple((float)this->m_MouseXPos, (float)this->m_MouseYPos);
}
