load("@npm_bazel_typescript//:index.bzl", "ts_library", "ts_devserver")
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

ts_devserver(
    name="game",
    static_files=[
        "bundle.js",
        "index.html",
        "style.css",
    ],
)
    

rollup_bundle(
    name="bundle",
    deps = [":main"],
    entry_point="main.ts",
)
