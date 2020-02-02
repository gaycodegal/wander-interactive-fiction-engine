package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "DEPS", "LINKOPTS")

cc_library(
    name = "querier",
    hdrs = glob([
        "*.hh",
				"*.cc"
    ]),
    copts = COPTS,
		deps = DEPS,
    linkopts = LINKOPTS,
)

cc_library(
    name = "debug",
    hdrs = glob([
        "*.hh",
				"*.cc"
    ]),
    copts = COPTS + [ "-g" ],
		deps = DEPS,
    linkopts = LINKOPTS,
)