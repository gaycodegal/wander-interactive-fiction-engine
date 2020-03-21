#include "graphics.hh"

canvas::Graphics *canvas::Graphics::m_instance = nullptr;
bool canvas::Graphics::m_initialized = false;

canvas::Graphics *canvas::Graphics::Instance(Str title) {
  if (!m_instance) {
    m_instance = new Graphics(title);
  }

  return m_instance;
}

void canvas::Graphics::Release() {
  delete m_instance;
  m_instance = nullptr;

  m_initialized = false;
}

bool canvas::Graphics::Initialized() { return m_initialized; }

canvas::Graphics::Graphics(Str title)
    : m_window(nullptr, SDL_DestroyWindow),
      m_surface(nullptr, FreeSurface),
      m_renderer(nullptr, SDL_DestroyRenderer) {
  m_initialized = Init(title);
}

canvas::Graphics::~Graphics() {
  TTF_Quit();
  IMG_Quit();
  SDL_Quit();
}

bool canvas::Graphics::Init(Str title) {
  if (SDL_Init(SDL_INIT_EVERYTHING) < 0) {
    printf("SDL Init Error: %s\n", SDL_GetError());
    return false;
  }

  this->m_window.reset(SDL_CreateWindow("ah", SDL_WINDOWPOS_CENTERED,
                                         SDL_WINDOWPOS_CENTERED, this->m_width,
                                         this->m_height, SDL_WINDOW_SHOWN));

  if (!this->m_window) {
    printf("Window Creation Error: %s\n", SDL_GetError());
    return false;
  }

  this->m_renderer.reset(SDL_CreateRenderer(this->m_window.get(), -1, SDL_RENDERER_ACCELERATED));
  if(!this->m_renderer) {

    printf("Renderer Creation Error: %s\n", SDL_GetError());
    return false;
  }

  SDL_SetRenderDrawColor(this->m_renderer.get(), 0xff, 0xff, 0xff, 0xff);

  int flags = IMG_INIT_PNG;
  if(!(IMG_Init(flags) & flags)) {

    printf("Renderer Init Error: %s\n", IMG_GetError());
    return false;
  }

  if(TTF_Init() == -1) {

    printf("TTF Init Error: %s\n", TTF_GetError());
    return false;
  }

  this->m_surface.reset(SDL_GetWindowSurface(this->m_window.get()));

  return true;
}

void canvas::Graphics::ClearBackBuffer() {
  SDL_RenderClear(this->m_renderer.get());
}

void canvas::Graphics::DrawTexture(std::unique_ptr<SDL_Texture> text,
                                   std::unique_ptr<SDL_Rect> clip,
                                   std::unique_ptr<SDL_Rect> rend, float angle,
                                   SDL_RendererFlip flip) {
  SDL_RenderCopyEx(this->m_renderer.get(), text.get(), clip.get(), rend.get(),
                   angle, nullptr, flip);
}

void canvas::Graphics::Render() { SDL_RenderPresent(this->m_renderer.get()); }