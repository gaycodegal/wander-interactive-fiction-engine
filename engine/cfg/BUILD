package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "LINKOPTS")

cc_library(
    name = "cfg",
    srcs = glob([
        "*.cc",
    ]),
    hdrs = glob([
        "*.hh",
    ], exclude = [
        "cyk_intermediate.hh",
    ]),
    deps = [
        "//engine/util",
    ],
    copts = COPTS,
    linkopts = LINKOPTS,
    includes = [""],
)

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
