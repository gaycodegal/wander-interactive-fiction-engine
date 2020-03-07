package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "LINKOPTS")

cc_library(
    name = "sol",
    hdrs = glob([
        "*.hpp"
    ]),
    copts = COPTS,
    deps = [
        "//third_party/lua:lua-lib"
    ],
    linkopts = LINKOPTS,
    includes = [""],
)