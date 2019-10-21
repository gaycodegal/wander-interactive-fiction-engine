load("@io_bazel_rules_rust//rust:rust.bzl", "rust_binary")

rust_binary(
    name = "game",
    crate_root = "main.rs",
    srcs = [
        "main.rs",
    ],
    deps = [
        "//rust/cfg",
        "//rust/ift",
        "//cargo:serde_json",
    ],
)
