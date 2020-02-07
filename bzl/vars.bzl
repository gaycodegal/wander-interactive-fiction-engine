COPTS = select({
	"@bazel_tools//src/conditions:darwin": [
		"-std=c++17",
		"-stdlib=libc++",
		"-F/Library/Frameworks",
		"-Wall",
		"-Werror",
		"-pedantic",
		"-fpermissive", #TODO: Yell at sqlite_orm that it no work without this
#		"-O3",
	],
	"@bazel_tools//src/conditions:windows": [
		"-std=c++17",
		"-Wall",
		"-Werror",
		"-pedantic",
		"-fpermissive",
#		"-O3",
	],
	"//conditions:default": [
		"-std=c++17",
		"-Wall",
		"-Werror",
		"-pedantic",
		"-fpermissive",
#		"-O3",
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
                "-lstdc++fs",
		"-F/Library/Frameworks",
		"-framework SDL2",
		"-framework SDL2_image",
		"-framework SDL2_ttf",
		"-framework SDL2_mixer",
		"-lGLEW",
		"-lGL",
		"-ldl",
		"-lm",
		"-lsqlite3",
	],
	"@bazel_tools//src/conditions:windows": [],
	"//conditions:default": [
                "-lstdc++fs",
		"-lSDL2",
		"-lSDL2_image",
		"-lSDL2_ttf",
		"-lSDL2_mixer",
		"-lGLEW",
		"-lGL",
		"-ldl",
		"-lm",
		"-lsqlite3",
	],
})
