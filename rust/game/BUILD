load("@io_bazel_rules_rust//rust:rust.bzl", "rust_binary")

package(default_visibility = ["//visibility:public"])

rust_binary(
    name = "game",
    srcs = [
        "main.rs",
    ],
    crate_root = "main.rs",
    data = [
        "//rust/test-data",
    ],
    deps = [
        "//cargo:gluon",
        "//cargo:serde_json",
        "//rust/cfg",
        "//rust/ift",
        "//rust/querier",
    ],
)
