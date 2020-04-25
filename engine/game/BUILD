package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "LINKOPTS")

DEPS = [
	"//engine/canvas"
]

cc_binary(
	name = "game",
	srcs = [
		"game.cc"
	],
	copts = COPTS,
	deps = DEPS,
	linkopts = LINKOPTS,
)