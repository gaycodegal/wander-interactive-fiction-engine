load("@io_bazel_rules_rust//rust:rust.bzl", "rust_library", "rust_test")

package(default_visibility = ["//visibility:public"])

licenses([
    "notice",  # MIT
])

rust_library(
    name = "querier",
    srcs = [
        "dialogue_tree.rs",
        "lib.rs",
        "models.rs",
        "querier.rs",
        "schema.rs",
    ],
    crate_root = "lib.rs",
    rustc_flags = [
        "-lsqlite3",
    ],
    deps = [
        "//cargo:diesel",
        "//cargo:serde",
        "//cargo:serde_json",
        "//cargo:toml",
    ],
)

filegroup(
    name = "db_test_data",
    srcs = glob([
        "testdata/*.toml",
        "testdata/*.json",
    ]),
)

rust_test(
    name = "test",
    crate = ":querier",
    data = [
        "//rust/querier:db_test_data",
    ],
    rustc_flags = [
        "-lsqlite3",
    ],
)
