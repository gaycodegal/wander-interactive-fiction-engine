load("@io_bazel_rules_rust//rust:rust.bzl", "rust_library", "rust_test")

package(default_visibility = ["//visibility:public"])

licenses([
    "notice",  # MIT
])

rust_library(
    name = "cfg",
    srcs = [
        "ast.rs",
        "ast_search.rs",
        "lang.rs",
        "lib.rs",
    ],
    crate_root = "lib.rs",
)

rust_test(
    name = "test",
    crate = ":cfg",
    data = ["//rust/test-data"],
)
