COPTS = select({
	"@bazel_tools//src/conditions:darwin": [
		"-std=c++2a",
		"-stdlib=libc++",
		"-F/Library/Frameworks",
		"-Wall",
		"-Werror",
		"-pedantic",
		"-O3",
	],
	"@bazel_tools//src/conditions:windows": [
		"-std=c++2a",
		"-Wall",
		"-Werror",
		"-pedantic",
		"-O3",
	],
	"//conditions:default": [
		"-std=c++2a",
		"-Wall",
		"-Werror",
		"-pedantic",
		"-O3",
	],
})

DEPS = select({
	"@bazel_tools//src/conditions:windows": [
		"//third_party/SDL",
		"//third_party/SDL_mixer",
		"//third_party/SDL_image",
		"//third_party/SDL_ttf",
	],
	"//conditions:default": [
	],
})


LINKOPTS = select({
	"@bazel_tools//src/conditions:darwin": [
		"-F/Library/Frameworks",
		"-framework SDL2",
		"-framework SDL2_image",
		"-framework SDL2_ttf",
		"-framework SDL2_mixer",
		"-lGLEW",
		"-lGL",
		"-ldl",
		"-lm",
	],
	"@bazel_tools//src/conditions:windows": [],
	"//conditions:default": [
		"-lSDL2",
		"-lSDL2_image",
		"-lSDL2_ttf",
		"-lSDL2_mixer",
		"-lGLEW",
		"-lGL",
		"-ldl",
		"-lm",
	],
})