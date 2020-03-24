#include "graphics.hh"

std::unique_ptr<canvas::Graphics> canvas::Graphics::m_instance = nullptr;
bool canvas::Graphics::m_initialized = false;

std::unique_ptr<SDL_Texture, canvas::sdl_deleter> canvas::Graphics::LoadTexture(
    std::string path) {
  std::unique_ptr<SDL_Texture, canvas::sdl_deleter> texture;

  SDL_Surface *surface = IMG_Load(path.c_str());
  if (!surface) {
    printf("Image Load Error: Path(%s) - Error(%s)\n", path.c_str(),
           IMG_GetError());
    return texture;
  }

  texture.reset(SDL_CreateTextureFromSurface(this->m_renderer.get(), surface));
  if (!texture) {
    printf("Create Texture Error:%s\n", SDL_GetError());
    return texture;
  }

  SDL_FreeSurface(surface);

  return texture;
}

std::unique_ptr<SDL_Texture, canvas::sdl_deleter>
canvas::Graphics::CreateTextTexture(std::unique_ptr<TTF_Font, canvas::sdl_deleter> font,
                                    std::string text, SDL_Color color) {
  std::unique_ptr<SDL_Texture, canvas::sdl_deleter> texture;

  SDL_Surface *surface = TTF_RenderText_Solid(font.get(), text.c_str(), color);
  if (!surface) {
    printf("Text Render Error: %s\n", TTF_GetError());
    return texture;
  }

  texture.reset(SDL_CreateTextureFromSurface(this->m_renderer.get(), surface));
  if (!texture) {
    printf("Create Texture Error:%s\n", SDL_GetError());
    return texture;
  }

  SDL_FreeSurface(surface);

  return texture;
}

canvas::Graphics::Graphics(Str title) { m_initialized = Init(title); }

canvas::Graphics::~Graphics() {
  Release();
  TTF_Quit();
  IMG_Quit();
  SDL_Quit();
}

bool canvas::Graphics::Init(Str title) {
  if (SDL_Init(SDL_INIT_EVERYTHING) < 0) {
    printf("SDL Init Error: %s\n", SDL_GetError());
    return false;
  }

  this->m_window.reset(SDL_CreateWindow(title.c_str(), SDL_WINDOWPOS_CENTERED,
                                        SDL_WINDOWPOS_CENTERED, this->m_width,
                                        this->m_height, SDL_WINDOW_SHOWN));

  if (!this->m_window) {
    printf("Window Creation Error: %s\n", SDL_GetError());
    return false;
  }

  this->m_renderer.reset(
      SDL_CreateRenderer(this->m_window.get(), -1, SDL_RENDERER_ACCELERATED));
  if (!this->m_renderer) {
    printf("Renderer Creation Error: %s\n", SDL_GetError());
    return false;
  }

  SDL_SetRenderDrawColor(this->m_renderer.get(), 0xff, 0xff, 0xff, 0xff);

  int flags = IMG_INIT_PNG;
  if (!(IMG_Init(flags) & flags)) {
    printf("Renderer Init Error: %s\n", IMG_GetError());
    return false;
  }

  if (TTF_Init() == -1) {
    printf("TTF Init Error: %s\n", TTF_GetError());
    return false;
  }

  this->m_surface.reset(SDL_GetWindowSurface(this->m_window.get()));

  return true;
}