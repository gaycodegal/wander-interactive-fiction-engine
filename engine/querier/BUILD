package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "LINKOPTS")

cc_library(
    name = "querier",
    srcs = glob([
      "*.cc"
    ]),
    hdrs = glob([
        "*.hh"
    ]),
    copts = COPTS + ["-DTESTING"],
		deps = [
      "//engine/models",
      "//engine/util",
      "//third_party/json",
      "//third_party/sqlite_orm"
    ],
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
        ":querier",
        "@googletest//:gtest_main",
    ],
    data = [
        "test_dump_json.json",
    ],
    copts = COPTS + ["-DTESTING"],
    linkopts = LINKOPTS,
    linkstatic = 0,
)