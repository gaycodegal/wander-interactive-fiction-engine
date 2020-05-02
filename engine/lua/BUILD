package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "LINKOPTS")

cc_library(
    name = "lua",
    srcs = glob([
        "*.cc",
    ]),
    hdrs = glob([
        "*.hh",
    ]),
    deps = [
        "//engine/cfg",
        "//third_party/sol",
    ],
    copts = COPTS,
    linkopts = LINKOPTS,
    includes = [""],
)

cc_binary(
    name="lua-main",
    deps = [
        ":lua",
    ],
)
"""
cc_test(
    name = "test",
    size = "small",
    srcs = glob([
        "test/*.cc",
    ]),
    deps = [
        ":cfg",
        "@googletest//:gtest_main",
    ],
    data = [
        "test-lang-rules.txt",
        "test-lang-words.txt",
    ],
    copts = COPTS,
    linkopts = LINKOPTS,
    linkstatic = 0,
)
"""
