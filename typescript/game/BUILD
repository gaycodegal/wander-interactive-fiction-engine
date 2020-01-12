load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

ts_library(
    name="main",
    srcs=[
        "main.ts",
    ],
    deps=[
        "//typescript/testlib"
    ]
)

nodejs_binary(
    name = "game",
    data = [
        ":main",
    ],
    args=[
        "--declaration",
    ],
    entry_point="main.ts",
)
