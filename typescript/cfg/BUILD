load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("//typescript/test:defines.bzl", "ts_test")

package(default_visibility = ["//visibility:public"])

ts_library(
    name = "cfg",
    srcs = [
        "lang.ts",
        "ast_search.ts",
        "ast.ts",
    ],
)

ts_test(
    name = "test",
    deps = [
        ":cfg"
    ],
    srcs = [
        "lang_test.ts"
    ],
#   data = ["//rust/test-data"],
)
