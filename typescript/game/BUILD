load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

nodejs_binary(
    name = "example",
    data = [
        "@//:node_modules",
        "main.ts",
    ],
    entry_point = ":main.ts",
    args = ["--node_options=--expose-gc"],
)
