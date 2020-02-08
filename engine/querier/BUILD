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
      "//third_party/json",
      "//third_party/sqlite_orm"
    ],
    linkopts = LINKOPTS,
    includes = [""],
)

filegroup(
    name = "db_test_data",
    srcs = glob([
        "*.json",
    ]),
)