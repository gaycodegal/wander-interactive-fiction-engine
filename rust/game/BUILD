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
<<<<<<< HEAD
	"//rust/querier",
        "//cargo:serde_json",
        "//cargo:rusqlite",
    ],
    rustc_flags = [
        "-lsqlite3",
=======
        "//rust/querier",
>>>>>>> cda53e2a87c346b1a73ccb51da8d9f48262ac2bb
    ],
)
