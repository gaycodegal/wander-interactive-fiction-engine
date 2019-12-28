load("@io_bazel_rules_rust//rust:rust.bzl", "rust_binary", "rust_library", "rust_test")

package(default_visibility = ["//visibility:public"])

licenses([
  "notice" # MIT
])

rust_library(
    name = "ift",
    srcs = [
        "scene.rs",
        "sentence.rs",
        "lib.rs",
    ],
    deps = [
        "//rust/cfg",
        "//cargo:serde_json",
        "//cargo:lazy_static",
    ],
    crate_root = "lib.rs",
)

rust_test(
    name = "test",
    crate = ":ift",
    data = ["//rust/test-data"],
)
