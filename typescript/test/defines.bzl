load("@npm_bazel_typescript//:index.bzl", "ts_library", "ts_devserver")
load("@npm_bazel_rollup//:index.bzl", "rollup_bundle")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

def ts_test(name, srcs, deps):
    libname = "_lib" + name
    bunname = "_bun" + name
    nodename = bunname + ".js"
    print(libname, bunname, name, nodename)
    ts_library(
        name=libname,
        srcs=srcs,
        deps=deps,
    )
    rollup_bundle(
        name=bunname,
        deps = [":" + libname],
        entry_point="lang_test.ts",
        config_file = "//typescript/config:rollup.config.js",
    )
    nodejs_binary(
        name = name,
        data = [
            nodename,
        ],
        entry_point = nodename,
        args = ["--node_options=--expose-gc"],
    )
    
