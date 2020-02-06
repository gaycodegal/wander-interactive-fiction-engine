load("//bzl:vars.bzl", "COPTS", "LINKOPTS")

cc_library(
    name = "util",
    hdrs = glob([
        "*.hh",
    ]),
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
        ":util",
        "@googletest//:gtest_main",
    ],
    copts = COPTS,
    linkopts = LINKOPTS,
    linkstatic = 0,
)
