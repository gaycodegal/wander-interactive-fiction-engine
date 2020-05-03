package(default_visibility = ["//visibility:public"])
load("//bzl:vars.bzl", "COPTS", "LINKOPTS")

cc_library(
    name = "lua",
    srcs = [
        "expose.cc",
    ],
    hdrs = glob([
        "*.hh",
    ]),
    deps = [
        "//engine/cfg",
        "//third_party/sol",
    ],
    copts = COPTS,
    linkopts = LINKOPTS,
    includes = [""],
)

cc_binary(
    name="lua-main",
    srcs = [
        "expose_main.cc",
    ],
    deps = [
        ":lua",
    ],
    copts = COPTS,
    linkopts = LINKOPTS,
)

# for use only by humans because files it writes will actually show
# up in the source tree
sh_binary(
    name="lua-sh",
    srcs = [
        "lua.sh",
    ],
    data = [
        ":lua-main",
    ],
)
