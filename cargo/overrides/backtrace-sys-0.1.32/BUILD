package(default_visibility = ["//visibility:public"])

licenses([
    "notice",  # "MIT,Apache-2.0"
])

load(
    "@io_bazel_rules_rust//rust:rust.bzl",
    "rust_library",
    "rust_binary",
    "rust_test",
)

genrule(
    name="touch_config_header",
    outs=[
        "config.h",
    ],
    cmd="touch $@",
)

genrule(
    name="touch_backtrace_supported_header",
    outs=[
        "backtrace-supported.h",
    ],
    cmd="touch $@",
)

cc_library(
    name="backtrace_native",
    srcs=[
        ":touch_config_header",
        ":touch_backtrace_supported_header",
        "src/libbacktrace/internal.h",
        "src/libbacktrace/backtrace.h",
        "src/libbacktrace/alloc.c",
        "src/libbacktrace/dwarf.c",
        "src/libbacktrace/fileline.c",
        "src/libbacktrace/posix.c",
        "src/libbacktrace/read.c",
        "src/libbacktrace/sort.c",
        "src/libbacktrace/state.c",
        "src/libbacktrace/elf.c",
    ],
    includes=["."],
    copts=[
        "-fvisibility=hidden",
        "-fPIC",
    ],
    defines=[
        "BACKTRACE_ELF_SIZE=64",
        "BACKTRACE_SUPPORTED=1",
        "BACKTRACE_USES_MALLOC=1",
        "BACKTRACE_SUPPORTS_THREADS=0",
        "BACKTRACE_SUPPORTS_DATA=0",
        "HAVE_DL_ITERATE_PHDR=1",
        "_GNU_SOURCE=1",
        "_LARGE_FILES=1",
        "backtrace_full=__rbt_backtrace_full",
        "backtrace_dwarf_add=__rbt_backtrace_dwarf_add",
        "backtrace_initialize=__rbt_backtrace_initialize",
        "backtrace_pcinfo=__rbt_backtrace_pcinfo",
        "backtrace_syminfo=__rbt_backtrace_syminfo",
        "backtrace_get_view=__rbt_backtrace_get_view",
        "backtrace_release_view=__rbt_backtrace_release_view",
        "backtrace_alloc=__rbt_backtrace_alloc",
        "backtrace_free=__rbt_backtrace_free",
        "backtrace_vector_finish=__rbt_backtrace_vector_finish",
        "backtrace_vector_grow=__rbt_backtrace_vector_grow",
        "backtrace_vector_release=__rbt_backtrace_vector_release",
        "backtrace_close=__rbt_backtrace_close",
        "backtrace_open=__rbt_backtrace_open",
        "backtrace_print=__rbt_backtrace_print",
        "backtrace_simple=__rbt_backtrace_simple",
        "backtrace_qsort=__rbt_backtrace_qsort",
        "backtrace_create_state=__rbt_backtrace_create_state",
        "backtrace_uncompress_zdebug=__rbt_backtrace_uncompress_zdebug",
    ],
)

rust_library(
    name="backtrace_sys",
    crate_root="src/lib.rs",
    crate_type="lib",
    srcs=glob(["**/*.rs"]),
    deps=[
        "//cargo/vendor/libc-0.2.66:libc",
        ":backtrace_native",
    ],
    rustc_flags=[
    ],
    crate_features=[
    ],
)
