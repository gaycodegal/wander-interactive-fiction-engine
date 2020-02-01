package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "LINKOPTS")

DEPS = [
	"//engine/sdl",
]

cc_binary(
	name = "game",
	srcs = [
		"game.cc",
	],
	copts = COPTS,
	deps = DEPS,
	linkopts = LINKOPTS,
)

cc_binary(
	name = "debug",
	srcs = [
		"game.cc",
	],
	copts = COPTS + [ "-g" ],
	deps = DEPS,
	linkopts = LINKOPTS,
)