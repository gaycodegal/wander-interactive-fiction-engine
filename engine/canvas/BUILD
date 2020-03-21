package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "LINKOPTS")

DEPS = [
	"//engine/sdl",
	"//engine/util",
]

cc_library(
	name = "canvas",
	srcs = glob([
		"*.cc"
	]),
	hdrs = glob([
		"*.hh"
	]),
	copts = COPTS,
	deps = DEPS,
	linkopts = LINKOPTS,
	includes = [""],
)