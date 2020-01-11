package(default_visibility = ["//visibility:public"])

load("@build_bazel_rules_typescript//:defs.bzl", "ts_library")

ts_library(
    name = "testlib",
    srcs = glob(["*.ts"]),
    deps = [],
)

load("@build_bazel_rules_nodejs//:defs.bzl", "rollup_bundle")
