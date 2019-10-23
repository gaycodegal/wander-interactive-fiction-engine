load("//tools/build_rules:qt.bzl", "qt_cc_library")

cc_binary(
    name = "main",
    srcs = ["sources/main.cc"],
    copts = [
        '-fpic',
    ],
    deps = [
        "@qt//:qt_core",
        "@qt//:qt_gui",
        "@qt//:qt_qml",
        "@qt//:qt_quick"
    ]
)
