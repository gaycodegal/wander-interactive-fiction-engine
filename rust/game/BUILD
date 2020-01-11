load("@io_bazel_rules_rust//rust:rust.bzl", "rust_binary", "rust_doc")

package(default_visibility = ["//visibility:public"])

rust_binary(
    name = "game",
    crate_root = "main.rs",
    srcs = [
        "main.rs",
    ],
    data = [
        "//rust/test-data",
    ],
    deps = [
        "//rust/cfg",
        "//rust/ift",
	"//rust/querier",
	"//cargo:gluon",
        "//cargo:serde_json",
    ],
)
