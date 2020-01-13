load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("//typescript/test:defines.bzl", "ts_test")

package(default_visibility = ["//visibility:public"])

ts_library(
    name = "cfg",
    srcs = [
        "ast.ts",
        "ast_search.ts",
        "lang.ts",
    ],
)

ts_test(
    name = "test",
    srcs = [
        "lang_test.ts",
    ],
    deps = [
        ":cfg",
    ],
    #   data = ["//rust/test-data"],
)
