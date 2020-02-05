cc_library(
    name = "cfg",
    srcs = glob([
        "*.cc",
    ]),
    hdrs = glob([
        "*.hh",
    ]),
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
    linkstatic = 0,
)
