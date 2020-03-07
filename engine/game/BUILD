package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "LINKOPTS")

DEPS = [
	"//engine/querier",
	"//engine/sdl",
	"//third_party/entt",
	"//third_party/sol"
]

cc_binary(
	name = "game",
	srcs = [
		"game.cc",
	],
	copts = COPTS + ["-DTESTING"],
	deps = DEPS,
	linkopts = LINKOPTS,
)