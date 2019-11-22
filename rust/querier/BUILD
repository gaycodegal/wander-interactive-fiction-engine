load("@io_bazel_rules_rust//rust:rust.bzl", "rust_binary", "rust_library", "rust_test")

package(default_visibility = ["//visibility:public"])

licenses([
    "notice" # MIT
])

rust_library(
    name = "querier",
    srcs = [
        "lib.rs",
        "models.rs",
        "querier.rs",
        "schema.rs"
    ],
    deps = [
        "//cargo:diesel",
    ],
    crate_root = "lib.rs",
    rustc_flags = [
        "-lsqlite3",
    ],
)
