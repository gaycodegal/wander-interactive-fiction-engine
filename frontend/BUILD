load("//tools/build_rules:qt.bzl", "qt_cc_library")

cc_binary(
    name = "main",
    srcs = [
        "sources/main.cc",
#        "headers/fileio.hh",
    ],
    copts = [
        '-fpic',
    ],
    data = glob(
        [
            "views/**",
            "icons/**"
        ]
    ),
    deps = [
        ":dbmanager",
        ":fileio",
        "@qt//:qt_core",
        "@qt//:qt_gui",
        "@qt//:qt_qml",
        "@qt//:qt_quick",
	"@qt//:qt_quick_controls"
    ]
)

qt_cc_library(
    name = "dbmanager",
    src = "sources/dbmanager.cc",
    hdr = "headers/dbmanager.hh",
    copts = [
        '-fpic',
    ],
    deps = [
        "@qt//:qt_core",
        "@qt//:qt_sql",
    ],
)


qt_cc_library(
    name = "fileio",
    src = "sources/fileio.cc",
    hdr = "headers/fileio.hh",
    copts = [
        '-fpic',
    ],
    deps = [
        "@qt//:qt_core",
    ],
)
