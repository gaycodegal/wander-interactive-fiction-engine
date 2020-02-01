load("@io_bazel_rules_rust//rust:rust.bzl", "rust_library", "rust_test")

package(default_visibility = ["//visibility:public"])

licenses([
    "notice",  # MIT
])

rust_library(
    name = "ift",
    srcs = [
        "lib.rs",
        "scene.rs",
        "sentence.rs",
    ],
    crate_root = "lib.rs",
    deps = [
        "//cargo:lazy_static",
        "//cargo:serde_json",
        "//rust/cfg",
    ],
)

rust_test(
    name = "test",
    crate = ":ift",
    data = ["//rust/test-data"],
)
