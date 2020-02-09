package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "LINKOPTS")

cc_library(
    name = "models",
    srcs = glob([
      "*.cc"
    ]),
    hdrs = glob([
        "*.hh"
    ]),
    copts = COPTS,
		deps = [
      "//engine/util",
      "//third_party/json",
    ],
    linkopts = LINKOPTS,
    includes = [""],
)