load("@npm_bazel_rollup//:index.bzl", "rollup_bundle")
load("@npm_bazel_typescript//:index.bzl", "ts_devserver", "ts_library")

ts_library(
    name = "main",
    srcs = [
        "main.ts",
    ],
    deps = [
        "//typescript/testlib",
    ],
)

ts_devserver(
    name = "game",
    static_files = [
        "bundle.js",
        "index.html",
        "style.css",
    ],
)

rollup_bundle(
    name = "bundle",
    config_file = "//typescript/config:rollup.config.js",
    entry_point = "main.ts",
    deps = [":main"],
)
