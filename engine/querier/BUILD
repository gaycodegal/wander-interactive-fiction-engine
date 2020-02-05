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
    copts = COPTS,
		deps = [
      "//third_party/sqlite_orm"
    ],
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
		deps = [
      "//third_party/sqlite_orm"
    ],
    linkopts = LINKOPTS,
)