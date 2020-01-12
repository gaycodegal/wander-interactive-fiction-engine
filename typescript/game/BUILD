load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("@npm_bazel_rollup//:index.bzl", "rollup_bundle")

ts_library(
    name="main",
    srcs=[
        "main.ts",
    ],
    deps=[
        "//typescript/testlib"
    ]
)

rollup_bundle(
    name="bundle",
    deps = [":main"],
    entry_point="main.ts",
)
