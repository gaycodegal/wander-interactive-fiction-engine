package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "DEPS", "LINKOPTS")

cc_library(
    name = "querier",
    srcs = glob([
      "*.cc"
    ]),
    hdrs = glob([
        "*.hh"
    ]),
    copts = COPTS,
		deps = DEPS,
    linkopts = LINKOPTS,
)

cc_library(
    name = "debug",
    srcs = glob([
      "*.cc"
    ]),
    hdrs = glob([
        "*.hh"
    ]),
    copts = COPTS + [ "-g" ],
		deps = DEPS,
    linkopts = LINKOPTS,
)