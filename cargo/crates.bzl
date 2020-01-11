"""
cargo-raze crate workspace functions

DO NOT EDIT! Replaced on runs of cargo-raze
"""
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
load("@bazel_tools//tools/build_defs/repo:git.bzl", "new_git_repository")

def _new_http_archive(name, **kwargs):
    if not native.existing_rule(name):
        http_archive(name=name, **kwargs)

def _new_git_repository(name, **kwargs):
    if not native.existing_rule(name):
        new_git_repository(name=name, **kwargs)

def raze_fetch_remote_crates():

    _new_http_archive(
        name = "raze__ahash__0_2_18",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/ahash/ahash-0.2.18.crate",
        type = "tar.gz",
        sha256 = "6f33b5018f120946c1dcf279194f238a9f146725593ead1c08fa47ff22b0b5d3",
        strip_prefix = "ahash-0.2.18",
        build_file = Label("//cargo/remote:ahash-0.2.18.BUILD")
    )

    _new_http_archive(
        name = "raze__aho_corasick__0_7_6",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/aho-corasick/aho-corasick-0.7.6.crate",
        type = "tar.gz",
        sha256 = "58fb5e95d83b38284460a5fda7d6470aa0b8844d283a0b614b8535e880800d2d",
        strip_prefix = "aho-corasick-0.7.6",
        build_file = Label("//cargo/remote:aho-corasick-0.7.6.BUILD")
    )

    _new_http_archive(
        name = "raze__anymap__0_12_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/anymap/anymap-0.12.1.crate",
        type = "tar.gz",
        sha256 = "33954243bd79057c2de7338850b85983a44588021f8a5fee574a8888c6de4344",
        strip_prefix = "anymap-0.12.1",
        build_file = Label("//cargo/remote:anymap-0.12.1.BUILD")
    )

    _new_http_archive(
        name = "raze__archery__0_3_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/archery/archery-0.3.0.crate",
        type = "tar.gz",
        sha256 = "d308d8fa3f687f7a7588fccc4812ed6914be09518232f00454693a7417273ad2",
        strip_prefix = "archery-0.3.0",
        build_file = Label("//cargo/remote:archery-0.3.0.BUILD")
    )

    _new_http_archive(
        name = "raze__arrayref__0_3_5",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/arrayref/arrayref-0.3.5.crate",
        type = "tar.gz",
        sha256 = "0d382e583f07208808f6b1249e60848879ba3543f57c32277bf52d69c2f0f0ee",
        strip_prefix = "arrayref-0.3.5",
        build_file = Label("//cargo/remote:arrayref-0.3.5.BUILD")
    )

    _new_http_archive(
        name = "raze__arrayvec__0_5_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/arrayvec/arrayvec-0.5.1.crate",
        type = "tar.gz",
        sha256 = "cff77d8686867eceff3105329d4698d96c2391c176d5d03adc90c7389162b5b8",
        strip_prefix = "arrayvec-0.5.1",
        build_file = Label("//cargo/remote:arrayvec-0.5.1.BUILD")
    )

    _new_http_archive(
        name = "raze__ascii_canvas__2_0_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/ascii-canvas/ascii-canvas-2.0.0.crate",
        type = "tar.gz",
        sha256 = "ff8eb72df928aafb99fe5d37b383f2fe25bd2a765e3e5f7c365916b6f2463a29",
        strip_prefix = "ascii-canvas-2.0.0",
        build_file = Label("//cargo/remote:ascii-canvas-2.0.0.BUILD")
    )

    _new_http_archive(
        name = "raze__atty__0_2_13",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/atty/atty-0.2.13.crate",
        type = "tar.gz",
        sha256 = "1803c647a3ec87095e7ae7acfca019e98de5ec9a7d01343f611cf3152ed71a90",
        strip_prefix = "atty-0.2.13",
        build_file = Label("//cargo/remote:atty-0.2.13.BUILD")
    )

    _new_http_archive(
        name = "raze__autocfg__0_1_7",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/autocfg/autocfg-0.1.7.crate",
        type = "tar.gz",
        sha256 = "1d49d90015b3c36167a20fe2810c5cd875ad504b39cff3d4eae7977e6b7c1cb2",
        strip_prefix = "autocfg-0.1.7",
        build_file = Label("//cargo/remote:autocfg-0.1.7.BUILD")
    )

    _new_http_archive(
        name = "raze__backtrace__0_3_40",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/backtrace/backtrace-0.3.40.crate",
        type = "tar.gz",
        sha256 = "924c76597f0d9ca25d762c25a4d369d51267536465dc5064bdf0eb073ed477ea",
        strip_prefix = "backtrace-0.3.40",
        build_file = Label("//cargo/remote:backtrace-0.3.40.BUILD")
    )

    _new_http_archive(
        name = "raze__backtrace_sys__0_1_32",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/backtrace-sys/backtrace-sys-0.1.32.crate",
        type = "tar.gz",
        sha256 = "5d6575f128516de27e3ce99689419835fce9643a9b215a14d2b5b685be018491",
        strip_prefix = "backtrace-sys-0.1.32",
        build_file = Label("//cargo/remote:backtrace-sys-0.1.32.BUILD")
    )

    _new_http_archive(
        name = "raze__base64__0_10_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/base64/base64-0.10.1.crate",
        type = "tar.gz",
        sha256 = "0b25d992356d2eb0ed82172f5248873db5560c4721f564b13cb5193bda5e668e",
        strip_prefix = "base64-0.10.1",
        build_file = Label("//cargo/remote:base64-0.10.1.BUILD")
    )

    _new_http_archive(
        name = "raze__bit_set__0_5_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/bit-set/bit-set-0.5.1.crate",
        type = "tar.gz",
        sha256 = "e84c238982c4b1e1ee668d136c510c67a13465279c0cb367ea6baf6310620a80",
        strip_prefix = "bit-set-0.5.1",
        build_file = Label("//cargo/remote:bit-set-0.5.1.BUILD")
    )

    _new_http_archive(
        name = "raze__bit_vec__0_5_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/bit-vec/bit-vec-0.5.1.crate",
        type = "tar.gz",
        sha256 = "f59bbe95d4e52a6398ec21238d31577f2b28a9d86807f06ca59d191d8440d0bb",
        strip_prefix = "bit-vec-0.5.1",
        build_file = Label("//cargo/remote:bit-vec-0.5.1.BUILD")
    )

    _new_http_archive(
        name = "raze__bitflags__1_2_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/bitflags/bitflags-1.2.1.crate",
        type = "tar.gz",
        sha256 = "cf1de2fe8c75bc145a2f577add951f8134889b4795d47466a54a5c846d691693",
        strip_prefix = "bitflags-1.2.1",
        build_file = Label("//cargo/remote:bitflags-1.2.1.BUILD")
    )

    _new_http_archive(
        name = "raze__blake2b_simd__0_5_9",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/blake2b_simd/blake2b_simd-0.5.9.crate",
        type = "tar.gz",
        sha256 = "b83b7baab1e671718d78204225800d6b170e648188ac7dc992e9d6bddf87d0c0",
        strip_prefix = "blake2b_simd-0.5.9",
        build_file = Label("//cargo/remote:blake2b_simd-0.5.9.BUILD")
    )

    _new_http_archive(
        name = "raze__block_buffer__0_7_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/block-buffer/block-buffer-0.7.3.crate",
        type = "tar.gz",
        sha256 = "c0940dc441f31689269e10ac70eb1002a3a1d3ad1390e030043662eb7fe4688b",
        strip_prefix = "block-buffer-0.7.3",
        build_file = Label("//cargo/remote:block-buffer-0.7.3.BUILD")
    )

    _new_http_archive(
        name = "raze__block_padding__0_1_5",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/block-padding/block-padding-0.1.5.crate",
        type = "tar.gz",
        sha256 = "fa79dedbb091f449f1f39e53edf88d5dbe95f895dae6135a8d7b881fb5af73f5",
        strip_prefix = "block-padding-0.1.5",
        build_file = Label("//cargo/remote:block-padding-0.1.5.BUILD")
    )

    _new_http_archive(
        name = "raze__byte_tools__0_3_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/byte-tools/byte-tools-0.3.1.crate",
        type = "tar.gz",
        sha256 = "e3b5ca7a04898ad4bcd41c90c5285445ff5b791899bb1b0abdd2a2aa791211d7",
        strip_prefix = "byte-tools-0.3.1",
        build_file = Label("//cargo/remote:byte-tools-0.3.1.BUILD")
    )

    _new_http_archive(
        name = "raze__byteorder__1_3_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/byteorder/byteorder-1.3.2.crate",
        type = "tar.gz",
        sha256 = "a7c3dd8985a7111efc5c80b44e23ecdd8c007de8ade3b96595387e812b957cf5",
        strip_prefix = "byteorder-1.3.2",
        build_file = Label("//cargo/remote:byteorder-1.3.2.BUILD")
    )

    _new_http_archive(
        name = "raze__c2_chacha__0_2_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/c2-chacha/c2-chacha-0.2.3.crate",
        type = "tar.gz",
        sha256 = "214238caa1bf3a496ec3392968969cab8549f96ff30652c9e56885329315f6bb",
        strip_prefix = "c2-chacha-0.2.3",
        build_file = Label("//cargo/remote:c2-chacha-0.2.3.BUILD")
    )

    _new_http_archive(
        name = "raze__cc__1_0_48",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/cc/cc-1.0.48.crate",
        type = "tar.gz",
        sha256 = "f52a465a666ca3d838ebbf08b241383421412fe7ebb463527bba275526d89f76",
        strip_prefix = "cc-1.0.48",
        build_file = Label("//cargo/remote:cc-1.0.48.BUILD")
    )

    _new_http_archive(
        name = "raze__cfg_if__0_1_10",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/cfg-if/cfg-if-0.1.10.crate",
        type = "tar.gz",
        sha256 = "4785bdd1c96b2a846b2bd7cc02e86b6b3dbf14e7e53446c4f54c92a361040822",
        strip_prefix = "cfg-if-0.1.10",
        build_file = Label("//cargo/remote:cfg-if-0.1.10.BUILD")
    )

    _new_http_archive(
        name = "raze__cloudabi__0_0_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/cloudabi/cloudabi-0.0.3.crate",
        type = "tar.gz",
        sha256 = "ddfc5b9aa5d4507acaf872de71051dfd0e309860e88966e1051e462a077aac4f",
        strip_prefix = "cloudabi-0.0.3",
        build_file = Label("//cargo/remote:cloudabi-0.0.3.BUILD")
    )

    _new_http_archive(
        name = "raze__codespan__0_3_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/codespan/codespan-0.3.0.crate",
        type = "tar.gz",
        sha256 = "03ed0fdf823b4a01c3b6a3e086b4d0a2def8d3cb75b110ec5c988fe2790860a9",
        strip_prefix = "codespan-0.3.0",
        build_file = Label("//cargo/remote:codespan-0.3.0.BUILD")
    )

    _new_http_archive(
        name = "raze__codespan_reporting__0_3_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/codespan-reporting/codespan-reporting-0.3.0.crate",
        type = "tar.gz",
        sha256 = "2ae73f6c4b3803dc2a0fe08ed1ce40e8f3f94ecc8394a82e0696bbc86d4e4fc3",
        strip_prefix = "codespan-reporting-0.3.0",
        build_file = Label("//cargo/remote:codespan-reporting-0.3.0.BUILD")
    )

    _new_http_archive(
        name = "raze__collect_mac__0_1_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/collect-mac/collect-mac-0.1.0.crate",
        type = "tar.gz",
        sha256 = "f168712e49987bd2f51cb855c4585999e12b1a0abdff60fea4b81b41f2010264",
        strip_prefix = "collect-mac-0.1.0",
        build_file = Label("//cargo/remote:collect-mac-0.1.0.BUILD")
    )

    _new_http_archive(
        name = "raze__const_random__0_1_6",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/const-random/const-random-0.1.6.crate",
        type = "tar.gz",
        sha256 = "7b641a8c9867e341f3295564203b1c250eb8ce6cb6126e007941f78c4d2ed7fe",
        strip_prefix = "const-random-0.1.6",
        build_file = Label("//cargo/remote:const-random-0.1.6.BUILD")
    )

    _new_http_archive(
        name = "raze__const_random_macro__0_1_6",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/const-random-macro/const-random-macro-0.1.6.crate",
        type = "tar.gz",
        sha256 = "c750ec12b83377637110d5a57f5ae08e895b06c4b16e2bdbf1a94ef717428c59",
        strip_prefix = "const-random-macro-0.1.6",
        build_file = Label("//cargo/remote:const-random-macro-0.1.6.BUILD")
    )

    _new_http_archive(
        name = "raze__constant_time_eq__0_1_4",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/constant_time_eq/constant_time_eq-0.1.4.crate",
        type = "tar.gz",
        sha256 = "995a44c877f9212528ccc74b21a232f66ad69001e40ede5bcee2ac9ef2657120",
        strip_prefix = "constant_time_eq-0.1.4",
        build_file = Label("//cargo/remote:constant_time_eq-0.1.4.BUILD")
    )

    _new_http_archive(
        name = "raze__crossbeam__0_7_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/crossbeam/crossbeam-0.7.3.crate",
        type = "tar.gz",
        sha256 = "69323bff1fb41c635347b8ead484a5ca6c3f11914d784170b158d8449ab07f8e",
        strip_prefix = "crossbeam-0.7.3",
        build_file = Label("//cargo/remote:crossbeam-0.7.3.BUILD")
    )

    _new_http_archive(
        name = "raze__crossbeam_channel__0_4_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/crossbeam-channel/crossbeam-channel-0.4.0.crate",
        type = "tar.gz",
        sha256 = "acec9a3b0b3559f15aee4f90746c4e5e293b701c0f7d3925d24e01645267b68c",
        strip_prefix = "crossbeam-channel-0.4.0",
        build_file = Label("//cargo/remote:crossbeam-channel-0.4.0.BUILD")
    )

    _new_http_archive(
        name = "raze__crossbeam_deque__0_7_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/crossbeam-deque/crossbeam-deque-0.7.2.crate",
        type = "tar.gz",
        sha256 = "c3aa945d63861bfe624b55d153a39684da1e8c0bc8fba932f7ee3a3c16cea3ca",
        strip_prefix = "crossbeam-deque-0.7.2",
        build_file = Label("//cargo/remote:crossbeam-deque-0.7.2.BUILD")
    )

    _new_http_archive(
        name = "raze__crossbeam_epoch__0_8_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/crossbeam-epoch/crossbeam-epoch-0.8.0.crate",
        type = "tar.gz",
        sha256 = "5064ebdbf05ce3cb95e45c8b086f72263f4166b29b97f6baff7ef7fe047b55ac",
        strip_prefix = "crossbeam-epoch-0.8.0",
        build_file = Label("//cargo/remote:crossbeam-epoch-0.8.0.BUILD")
    )

    _new_http_archive(
        name = "raze__crossbeam_queue__0_2_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/crossbeam-queue/crossbeam-queue-0.2.1.crate",
        type = "tar.gz",
        sha256 = "c695eeca1e7173472a32221542ae469b3e9aac3a4fc81f7696bcad82029493db",
        strip_prefix = "crossbeam-queue-0.2.1",
        build_file = Label("//cargo/remote:crossbeam-queue-0.2.1.BUILD")
    )

    _new_http_archive(
        name = "raze__crossbeam_utils__0_6_6",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/crossbeam-utils/crossbeam-utils-0.6.6.crate",
        type = "tar.gz",
        sha256 = "04973fa96e96579258a5091af6003abde64af786b860f18622b82e026cca60e6",
        strip_prefix = "crossbeam-utils-0.6.6",
        build_file = Label("//cargo/remote:crossbeam-utils-0.6.6.BUILD")
    )

    _new_http_archive(
        name = "raze__crossbeam_utils__0_7_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/crossbeam-utils/crossbeam-utils-0.7.0.crate",
        type = "tar.gz",
        sha256 = "ce446db02cdc3165b94ae73111e570793400d0794e46125cc4056c81cbb039f4",
        strip_prefix = "crossbeam-utils-0.7.0",
        build_file = Label("//cargo/remote:crossbeam-utils-0.7.0.BUILD")
    )

    _new_http_archive(
        name = "raze__derive_new__0_5_8",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/derive-new/derive-new-0.5.8.crate",
        type = "tar.gz",
        sha256 = "71f31892cd5c62e414316f2963c5689242c43d8e7bbcaaeca97e5e28c95d91d9",
        strip_prefix = "derive-new-0.5.8",
        build_file = Label("//cargo/remote:derive-new-0.5.8.BUILD")
    )

    _new_http_archive(
        name = "raze__diesel__1_4_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/diesel/diesel-1.4.3.crate",
        type = "tar.gz",
        sha256 = "9d7cc03b910de9935007861dce440881f69102aaaedfd4bc5a6f40340ca5840c",
        strip_prefix = "diesel-1.4.3",
        build_file = Label("//cargo/remote:diesel-1.4.3.BUILD")
    )

    _new_http_archive(
        name = "raze__diesel_derives__1_4_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/diesel_derives/diesel_derives-1.4.1.crate",
        type = "tar.gz",
        sha256 = "45f5098f628d02a7a0f68ddba586fb61e80edec3bdc1be3b921f4ceec60858d3",
        strip_prefix = "diesel_derives-1.4.1",
        build_file = Label("//cargo/remote:diesel_derives-1.4.1.BUILD")
    )

    _new_http_archive(
        name = "raze__diff__0_1_12",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/diff/diff-0.1.12.crate",
        type = "tar.gz",
        sha256 = "0e25ea47919b1560c4e3b7fe0aaab9becf5b84a10325ddf7db0f0ba5e1026499",
        strip_prefix = "diff-0.1.12",
        build_file = Label("//cargo/remote:diff-0.1.12.BUILD")
    )

    _new_http_archive(
        name = "raze__digest__0_8_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/digest/digest-0.8.1.crate",
        type = "tar.gz",
        sha256 = "f3d0c8c8752312f9713efd397ff63acb9f85585afbf179282e720e7704954dd5",
        strip_prefix = "digest-0.8.1",
        build_file = Label("//cargo/remote:digest-0.8.1.BUILD")
    )

    _new_http_archive(
        name = "raze__dirs__1_0_5",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/dirs/dirs-1.0.5.crate",
        type = "tar.gz",
        sha256 = "3fd78930633bd1c6e35c4b42b1df7b0cbc6bc191146e512bb3bedf243fcc3901",
        strip_prefix = "dirs-1.0.5",
        build_file = Label("//cargo/remote:dirs-1.0.5.BUILD")
    )

    _new_http_archive(
        name = "raze__docopt__1_1_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/docopt/docopt-1.1.0.crate",
        type = "tar.gz",
        sha256 = "7f525a586d310c87df72ebcd98009e57f1cc030c8c268305287a476beb653969",
        strip_prefix = "docopt-1.1.0",
        build_file = Label("//cargo/remote:docopt-1.1.0.BUILD")
    )

    _new_http_archive(
        name = "raze__downcast_rs__1_1_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/downcast-rs/downcast-rs-1.1.1.crate",
        type = "tar.gz",
        sha256 = "52ba6eb47c2131e784a38b726eb54c1e1484904f013e576a25354d0124161af6",
        strip_prefix = "downcast-rs-1.1.1",
        build_file = Label("//cargo/remote:downcast-rs-1.1.1.BUILD")
    )

    _new_http_archive(
        name = "raze__either__1_5_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/either/either-1.5.3.crate",
        type = "tar.gz",
        sha256 = "bb1f6b1ce1c140482ea30ddd3335fc0024ac7ee112895426e0a629a6c20adfe3",
        strip_prefix = "either-1.5.3",
        build_file = Label("//cargo/remote:either-1.5.3.BUILD")
    )

    _new_http_archive(
        name = "raze__ena__0_13_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/ena/ena-0.13.1.crate",
        type = "tar.gz",
        sha256 = "8944dc8fa28ce4a38f778bd46bf7d923fe73eed5a439398507246c8e017e6f36",
        strip_prefix = "ena-0.13.1",
        build_file = Label("//cargo/remote:ena-0.13.1.BUILD")
    )

    _new_http_archive(
        name = "raze__failure__0_1_6",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/failure/failure-0.1.6.crate",
        type = "tar.gz",
        sha256 = "f8273f13c977665c5db7eb2b99ae520952fe5ac831ae4cd09d80c4c7042b5ed9",
        strip_prefix = "failure-0.1.6",
        build_file = Label("//cargo/remote:failure-0.1.6.BUILD")
    )

    _new_http_archive(
        name = "raze__failure_derive__0_1_6",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/failure_derive/failure_derive-0.1.6.crate",
        type = "tar.gz",
        sha256 = "0bc225b78e0391e4b8683440bf2e63c2deeeb2ce5189eab46e2b68c6d3725d08",
        strip_prefix = "failure_derive-0.1.6",
        build_file = Label("//cargo/remote:failure_derive-0.1.6.BUILD")
    )

    _new_http_archive(
        name = "raze__fake_simd__0_1_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/fake-simd/fake-simd-0.1.2.crate",
        type = "tar.gz",
        sha256 = "e88a8acf291dafb59c2d96e8f59828f3838bb1a70398823ade51a84de6a6deed",
        strip_prefix = "fake-simd-0.1.2",
        build_file = Label("//cargo/remote:fake-simd-0.1.2.BUILD")
    )

    _new_http_archive(
        name = "raze__fixedbitset__0_1_9",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/fixedbitset/fixedbitset-0.1.9.crate",
        type = "tar.gz",
        sha256 = "86d4de0081402f5e88cdac65c8dcdcc73118c1a7a465e2a05f0da05843a8ea33",
        strip_prefix = "fixedbitset-0.1.9",
        build_file = Label("//cargo/remote:fixedbitset-0.1.9.BUILD")
    )

    _new_http_archive(
        name = "raze__fnv__1_0_6",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/fnv/fnv-1.0.6.crate",
        type = "tar.gz",
        sha256 = "2fad85553e09a6f881f739c29f0b00b0f01357c743266d478b68951ce23285f3",
        strip_prefix = "fnv-1.0.6",
        build_file = Label("//cargo/remote:fnv-1.0.6.BUILD")
    )

    _new_http_archive(
        name = "raze__frunk_core__0_3_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/frunk_core/frunk_core-0.3.1.crate",
        type = "tar.gz",
        sha256 = "0e04cda45add94e71c2990de778ae13059897d77b773130a9bc225e2970c413e",
        strip_prefix = "frunk_core-0.3.1",
        build_file = Label("//cargo/remote:frunk_core-0.3.1.BUILD")
    )

    _new_http_archive(
        name = "raze__fuchsia_cprng__0_1_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/fuchsia-cprng/fuchsia-cprng-0.1.1.crate",
        type = "tar.gz",
        sha256 = "a06f77d526c1a601b7c4cdd98f54b5eaabffc14d5f2f0296febdc7f357c6d3ba",
        strip_prefix = "fuchsia-cprng-0.1.1",
        build_file = Label("//cargo/remote:fuchsia-cprng-0.1.1.BUILD")
    )

    _new_http_archive(
        name = "raze__futures__0_1_29",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/futures/futures-0.1.29.crate",
        type = "tar.gz",
        sha256 = "1b980f2816d6ee8673b6517b52cb0e808a180efc92e5c19d02cdda79066703ef",
        strip_prefix = "futures-0.1.29",
        build_file = Label("//cargo/remote:futures-0.1.29.BUILD")
    )

    _new_http_archive(
        name = "raze__generic_array__0_12_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/generic-array/generic-array-0.12.3.crate",
        type = "tar.gz",
        sha256 = "c68f0274ae0e023facc3c97b2e00f076be70e254bc851d972503b328db79b2ec",
        strip_prefix = "generic-array-0.12.3",
        build_file = Label("//cargo/remote:generic-array-0.12.3.BUILD")
    )

    _new_http_archive(
        name = "raze__getrandom__0_1_13",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/getrandom/getrandom-0.1.13.crate",
        type = "tar.gz",
        sha256 = "e7db7ca94ed4cd01190ceee0d8a8052f08a247aa1b469a7f68c6a3b71afcf407",
        strip_prefix = "getrandom-0.1.13",
        build_file = Label("//cargo/remote:getrandom-0.1.13.BUILD")
    )

    _new_http_archive(
        name = "raze__gluon__0_13_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/gluon/gluon-0.13.1.crate",
        type = "tar.gz",
        sha256 = "206c4f959f679cdd85a35759b7f52ee260ad39b825208a2e9abaefc4a4b4d193",
        strip_prefix = "gluon-0.13.1",
        build_file = Label("//cargo/remote:gluon-0.13.1.BUILD")
    )

    _new_http_archive(
        name = "raze__gluon_base__0_13_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/gluon_base/gluon_base-0.13.1.crate",
        type = "tar.gz",
        sha256 = "9a93ba671b207b74a32ed83eefd7a4fa9792a06b67511dcecb42d31e5285b470",
        strip_prefix = "gluon_base-0.13.1",
        build_file = Label("//cargo/remote:gluon_base-0.13.1.BUILD")
    )

    _new_http_archive(
        name = "raze__gluon_check__0_13_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/gluon_check/gluon_check-0.13.1.crate",
        type = "tar.gz",
        sha256 = "acd39e3862a6981bba8fe7a491059c3f80d040da1d7e87227e03cb17d9d6c2f6",
        strip_prefix = "gluon_check-0.13.1",
        build_file = Label("//cargo/remote:gluon_check-0.13.1.BUILD")
    )

    _new_http_archive(
        name = "raze__gluon_codegen__0_13_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/gluon_codegen/gluon_codegen-0.13.1.crate",
        type = "tar.gz",
        sha256 = "720c5da0383b0b50795f45b29aafc53bb03671a2e7b37992002eca7d0e76fc39",
        strip_prefix = "gluon_codegen-0.13.1",
        build_file = Label("//cargo/remote:gluon_codegen-0.13.1.BUILD")
    )

    _new_http_archive(
        name = "raze__gluon_format__0_13_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/gluon_format/gluon_format-0.13.1.crate",
        type = "tar.gz",
        sha256 = "e20ac71435ca32e73fccc47cad0af05a3c5a9a13ba5a584ec27d0b099ea223f8",
        strip_prefix = "gluon_format-0.13.1",
        build_file = Label("//cargo/remote:gluon_format-0.13.1.BUILD")
    )

    _new_http_archive(
        name = "raze__gluon_parser__0_13_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/gluon_parser/gluon_parser-0.13.1.crate",
        type = "tar.gz",
        sha256 = "4bdbb1df0a52e9a28338d0b5c8363f1ab9df19c5d8ecc17ebbe0188d77b2ff39",
        strip_prefix = "gluon_parser-0.13.1",
        build_file = Label("//cargo/remote:gluon_parser-0.13.1.BUILD")
    )

    _new_http_archive(
        name = "raze__gluon_vm__0_13_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/gluon_vm/gluon_vm-0.13.1.crate",
        type = "tar.gz",
        sha256 = "955adc1593e6c9585fd412ae641e6f0f6edc31c7ab340945765e582cf166eedc",
        strip_prefix = "gluon_vm-0.13.1",
        build_file = Label("//cargo/remote:gluon_vm-0.13.1.BUILD")
    )

    _new_http_archive(
        name = "raze__hashbrown__0_6_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/hashbrown/hashbrown-0.6.3.crate",
        type = "tar.gz",
        sha256 = "8e6073d0ca812575946eb5f35ff68dbe519907b25c42530389ff946dc84c6ead",
        strip_prefix = "hashbrown-0.6.3",
        build_file = Label("//cargo/remote:hashbrown-0.6.3.BUILD")
    )

    _new_http_archive(
        name = "raze__heck__0_3_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/heck/heck-0.3.1.crate",
        type = "tar.gz",
        sha256 = "20564e78d53d2bb135c343b3f47714a56af2061f1c928fdb541dc7b9fdd94205",
        strip_prefix = "heck-0.3.1",
        build_file = Label("//cargo/remote:heck-0.3.1.BUILD")
    )

    _new_http_archive(
        name = "raze__indexmap__1_3_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/indexmap/indexmap-1.3.0.crate",
        type = "tar.gz",
        sha256 = "712d7b3ea5827fcb9d4fda14bf4da5f136f0db2ae9c8f4bd4e2d1c6fde4e6db2",
        strip_prefix = "indexmap-1.3.0",
        build_file = Label("//cargo/remote:indexmap-1.3.0.BUILD")
    )

    _new_http_archive(
        name = "raze__itertools__0_8_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/itertools/itertools-0.8.2.crate",
        type = "tar.gz",
        sha256 = "f56a2d0bc861f9165be4eb3442afd3c236d8a98afd426f65d92324ae1091a484",
        strip_prefix = "itertools-0.8.2",
        build_file = Label("//cargo/remote:itertools-0.8.2.BUILD")
    )

    _new_http_archive(
        name = "raze__itoa__0_4_4",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/itoa/itoa-0.4.4.crate",
        type = "tar.gz",
        sha256 = "501266b7edd0174f8530248f87f99c88fbe60ca4ef3dd486835b8d8d53136f7f",
        strip_prefix = "itoa-0.4.4",
        build_file = Label("//cargo/remote:itoa-0.4.4.BUILD")
    )

    _new_http_archive(
        name = "raze__lalrpop__0_17_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/lalrpop/lalrpop-0.17.2.crate",
        type = "tar.gz",
        sha256 = "64dc3698e75d452867d9bd86f4a723f452ce9d01fe1d55990b79f0c790aa67db",
        strip_prefix = "lalrpop-0.17.2",
        build_file = Label("//cargo/remote:lalrpop-0.17.2.BUILD")
    )

    _new_http_archive(
        name = "raze__lalrpop_util__0_17_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/lalrpop-util/lalrpop-util-0.17.2.crate",
        type = "tar.gz",
        sha256 = "c277d18683b36349ab5cd030158b54856fca6bb2d5dc5263b06288f486958b7c",
        strip_prefix = "lalrpop-util-0.17.2",
        build_file = Label("//cargo/remote:lalrpop-util-0.17.2.BUILD")
    )

    _new_http_archive(
        name = "raze__lazy_static__1_4_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/lazy_static/lazy_static-1.4.0.crate",
        type = "tar.gz",
        sha256 = "e2abad23fbc42b3700f2f279844dc832adb2b2eb069b2df918f455c4e18cc646",
        strip_prefix = "lazy_static-1.4.0",
        build_file = Label("//cargo/remote:lazy_static-1.4.0.BUILD")
    )

    _new_http_archive(
        name = "raze__libc__0_2_66",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/libc/libc-0.2.66.crate",
        type = "tar.gz",
        sha256 = "d515b1f41455adea1313a4a2ac8a8a477634fbae63cc6100e3aebb207ce61558",
        strip_prefix = "libc-0.2.66",
        build_file = Label("//cargo/remote:libc-0.2.66.BUILD")
    )

    _new_http_archive(
        name = "raze__libsqlite3_sys__0_16_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/libsqlite3-sys/libsqlite3-sys-0.16.0.crate",
        type = "tar.gz",
        sha256 = "5e5b95e89c330291768dc840238db7f9e204fd208511ab6319b56193a7f2ae25",
        strip_prefix = "libsqlite3-sys-0.16.0",
        build_file = Label("//cargo/remote:libsqlite3-sys-0.16.0.BUILD")
    )

    _new_http_archive(
        name = "raze__lock_api__0_3_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/lock_api/lock_api-0.3.2.crate",
        type = "tar.gz",
        sha256 = "e57b3997725d2b60dbec1297f6c2e2957cc383db1cebd6be812163f969c7d586",
        strip_prefix = "lock_api-0.3.2",
        build_file = Label("//cargo/remote:lock_api-0.3.2.BUILD")
    )

    _new_http_archive(
        name = "raze__log__0_4_8",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/log/log-0.4.8.crate",
        type = "tar.gz",
        sha256 = "14b6052be84e6b71ab17edffc2eeabf5c2c3ae1fdb464aae35ac50c67a44e1f7",
        strip_prefix = "log-0.4.8",
        build_file = Label("//cargo/remote:log-0.4.8.BUILD")
    )

    _new_http_archive(
        name = "raze__maybe_uninit__2_0_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/maybe-uninit/maybe-uninit-2.0.0.crate",
        type = "tar.gz",
        sha256 = "60302e4db3a61da70c0cb7991976248362f30319e88850c487b9b95bbf059e00",
        strip_prefix = "maybe-uninit-2.0.0",
        build_file = Label("//cargo/remote:maybe-uninit-2.0.0.BUILD")
    )

    _new_http_archive(
        name = "raze__memchr__2_2_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/memchr/memchr-2.2.1.crate",
        type = "tar.gz",
        sha256 = "88579771288728879b57485cc7d6b07d648c9f0141eb955f8ab7f9d45394468e",
        strip_prefix = "memchr-2.2.1",
        build_file = Label("//cargo/remote:memchr-2.2.1.BUILD")
    )

    _new_http_archive(
        name = "raze__memoffset__0_5_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/memoffset/memoffset-0.5.3.crate",
        type = "tar.gz",
        sha256 = "75189eb85871ea5c2e2c15abbdd541185f63b408415e5051f5cac122d8c774b9",
        strip_prefix = "memoffset-0.5.3",
        build_file = Label("//cargo/remote:memoffset-0.5.3.BUILD")
    )

    _new_http_archive(
        name = "raze__new_debug_unreachable__1_0_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/new_debug_unreachable/new_debug_unreachable-1.0.3.crate",
        type = "tar.gz",
        sha256 = "f40f005c60db6e03bae699e414c58bf9aa7ea02a2d0b9bfbcf19286cc4c82b30",
        strip_prefix = "new_debug_unreachable-1.0.3",
        build_file = Label("//cargo/remote:new_debug_unreachable-1.0.3.BUILD")
    )

    _new_http_archive(
        name = "raze__num_traits__0_2_10",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/num-traits/num-traits-0.2.10.crate",
        type = "tar.gz",
        sha256 = "d4c81ffc11c212fa327657cb19dd85eb7419e163b5b076bede2bdb5c974c07e4",
        strip_prefix = "num-traits-0.2.10",
        build_file = Label("//cargo/remote:num-traits-0.2.10.BUILD")
    )

    _new_http_archive(
        name = "raze__opaque_debug__0_2_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/opaque-debug/opaque-debug-0.2.3.crate",
        type = "tar.gz",
        sha256 = "2839e79665f131bdb5782e51f2c6c9599c133c6098982a54c794358bf432529c",
        strip_prefix = "opaque-debug-0.2.3",
        build_file = Label("//cargo/remote:opaque-debug-0.2.3.BUILD")
    )

    _new_http_archive(
        name = "raze__ordered_float__1_0_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/ordered-float/ordered-float-1.0.2.crate",
        type = "tar.gz",
        sha256 = "18869315e81473c951eb56ad5558bbc56978562d3ecfb87abb7a1e944cea4518",
        strip_prefix = "ordered-float-1.0.2",
        build_file = Label("//cargo/remote:ordered-float-1.0.2.BUILD")
    )

    _new_http_archive(
        name = "raze__ordermap__0_3_5",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/ordermap/ordermap-0.3.5.crate",
        type = "tar.gz",
        sha256 = "a86ed3f5f244b372d6b1a00b72ef7f8876d0bc6a78a4c9985c53614041512063",
        strip_prefix = "ordermap-0.3.5",
        build_file = Label("//cargo/remote:ordermap-0.3.5.BUILD")
    )

    _new_http_archive(
        name = "raze__parking_lot__0_9_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/parking_lot/parking_lot-0.9.0.crate",
        type = "tar.gz",
        sha256 = "f842b1982eb6c2fe34036a4fbfb06dd185a3f5c8edfaacdf7d1ea10b07de6252",
        strip_prefix = "parking_lot-0.9.0",
        build_file = Label("//cargo/remote:parking_lot-0.9.0.BUILD")
    )

    _new_http_archive(
        name = "raze__parking_lot_core__0_6_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/parking_lot_core/parking_lot_core-0.6.2.crate",
        type = "tar.gz",
        sha256 = "b876b1b9e7ac6e1a74a6da34d25c42e17e8862aa409cbbbdcfc8d86c6f3bc62b",
        strip_prefix = "parking_lot_core-0.6.2",
        build_file = Label("//cargo/remote:parking_lot_core-0.6.2.BUILD")
    )

    _new_http_archive(
        name = "raze__petgraph__0_4_13",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/petgraph/petgraph-0.4.13.crate",
        type = "tar.gz",
        sha256 = "9c3659d1ee90221741f65dd128d9998311b0e40c5d3c23a62445938214abce4f",
        strip_prefix = "petgraph-0.4.13",
        build_file = Label("//cargo/remote:petgraph-0.4.13.BUILD")
    )

    _new_http_archive(
        name = "raze__phf_generator__0_7_24",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/phf_generator/phf_generator-0.7.24.crate",
        type = "tar.gz",
        sha256 = "09364cc93c159b8b06b1f4dd8a4398984503483891b0c26b867cf431fb132662",
        strip_prefix = "phf_generator-0.7.24",
        build_file = Label("//cargo/remote:phf_generator-0.7.24.BUILD")
    )

    _new_http_archive(
        name = "raze__phf_shared__0_7_24",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/phf_shared/phf_shared-0.7.24.crate",
        type = "tar.gz",
        sha256 = "234f71a15de2288bcb7e3b6515828d22af7ec8598ee6d24c3b526fa0a80b67a0",
        strip_prefix = "phf_shared-0.7.24",
        build_file = Label("//cargo/remote:phf_shared-0.7.24.BUILD")
    )

    _new_http_archive(
        name = "raze__pkg_config__0_3_17",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/pkg-config/pkg-config-0.3.17.crate",
        type = "tar.gz",
        sha256 = "05da548ad6865900e60eaba7f589cc0783590a92e940c26953ff81ddbab2d677",
        strip_prefix = "pkg-config-0.3.17",
        build_file = Label("//cargo/remote:pkg-config-0.3.17.BUILD")
    )

    _new_http_archive(
        name = "raze__ppv_lite86__0_2_6",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/ppv-lite86/ppv-lite86-0.2.6.crate",
        type = "tar.gz",
        sha256 = "74490b50b9fbe561ac330df47c08f3f33073d2d00c150f719147d7c54522fa1b",
        strip_prefix = "ppv-lite86-0.2.6",
        build_file = Label("//cargo/remote:ppv-lite86-0.2.6.BUILD")
    )

    _new_http_archive(
        name = "raze__precomputed_hash__0_1_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/precomputed-hash/precomputed-hash-0.1.1.crate",
        type = "tar.gz",
        sha256 = "925383efa346730478fb4838dbe9137d2a47675ad789c546d150a6e1dd4ab31c",
        strip_prefix = "precomputed-hash-0.1.1",
        build_file = Label("//cargo/remote:precomputed-hash-0.1.1.BUILD")
    )

    _new_http_archive(
        name = "raze__pretty__0_5_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/pretty/pretty-0.5.2.crate",
        type = "tar.gz",
        sha256 = "f60c0d9f6fc88ecdd245d90c1920ff76a430ab34303fc778d33b1d0a4c3bf6d3",
        strip_prefix = "pretty-0.5.2",
        build_file = Label("//cargo/remote:pretty-0.5.2.BUILD")
    )

    _new_http_archive(
        name = "raze__proc_macro_hack__0_5_11",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/proc-macro-hack/proc-macro-hack-0.5.11.crate",
        type = "tar.gz",
        sha256 = "ecd45702f76d6d3c75a80564378ae228a85f0b59d2f3ed43c91b4a69eb2ebfc5",
        strip_prefix = "proc-macro-hack-0.5.11",
        build_file = Label("//cargo/remote:proc-macro-hack-0.5.11.BUILD")
    )

    _new_http_archive(
        name = "raze__proc_macro2__1_0_6",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/proc-macro2/proc-macro2-1.0.6.crate",
        type = "tar.gz",
        sha256 = "9c9e470a8dc4aeae2dee2f335e8f533e2d4b347e1434e5671afc49b054592f27",
        strip_prefix = "proc-macro2-1.0.6",
        build_file = Label("//cargo/remote:proc-macro2-1.0.6.BUILD")
    )

    _new_http_archive(
        name = "raze__quick_error__1_2_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/quick-error/quick-error-1.2.2.crate",
        type = "tar.gz",
        sha256 = "9274b940887ce9addde99c4eee6b5c44cc494b182b97e73dc8ffdcb3397fd3f0",
        strip_prefix = "quick-error-1.2.2",
        build_file = Label("//cargo/remote:quick-error-1.2.2.BUILD")
    )

    _new_http_archive(
        name = "raze__quote__1_0_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/quote/quote-1.0.2.crate",
        type = "tar.gz",
        sha256 = "053a8c8bcc71fcce321828dc897a98ab9760bef03a4fc36693c231e5b3216cfe",
        strip_prefix = "quote-1.0.2",
        build_file = Label("//cargo/remote:quote-1.0.2.BUILD")
    )

    _new_http_archive(
        name = "raze__rand__0_6_5",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand/rand-0.6.5.crate",
        type = "tar.gz",
        sha256 = "6d71dacdc3c88c1fde3885a3be3fbab9f35724e6ce99467f7d9c5026132184ca",
        strip_prefix = "rand-0.6.5",
        build_file = Label("//cargo/remote:rand-0.6.5.BUILD")
    )

    _new_http_archive(
        name = "raze__rand__0_7_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand/rand-0.7.2.crate",
        type = "tar.gz",
        sha256 = "3ae1b169243eaf61759b8475a998f0a385e42042370f3a7dbaf35246eacc8412",
        strip_prefix = "rand-0.7.2",
        build_file = Label("//cargo/remote:rand-0.7.2.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_chacha__0_1_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_chacha/rand_chacha-0.1.1.crate",
        type = "tar.gz",
        sha256 = "556d3a1ca6600bfcbab7c7c91ccb085ac7fbbcd70e008a98742e7847f4f7bcef",
        strip_prefix = "rand_chacha-0.1.1",
        build_file = Label("//cargo/remote:rand_chacha-0.1.1.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_chacha__0_2_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_chacha/rand_chacha-0.2.1.crate",
        type = "tar.gz",
        sha256 = "03a2a90da8c7523f554344f921aa97283eadf6ac484a6d2a7d0212fa7f8d6853",
        strip_prefix = "rand_chacha-0.2.1",
        build_file = Label("//cargo/remote:rand_chacha-0.2.1.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_core__0_3_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_core/rand_core-0.3.1.crate",
        type = "tar.gz",
        sha256 = "7a6fdeb83b075e8266dcc8762c22776f6877a63111121f5f8c7411e5be7eed4b",
        strip_prefix = "rand_core-0.3.1",
        build_file = Label("//cargo/remote:rand_core-0.3.1.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_core__0_4_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_core/rand_core-0.4.2.crate",
        type = "tar.gz",
        sha256 = "9c33a3c44ca05fa6f1807d8e6743f3824e8509beca625669633be0acbdf509dc",
        strip_prefix = "rand_core-0.4.2",
        build_file = Label("//cargo/remote:rand_core-0.4.2.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_core__0_5_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_core/rand_core-0.5.1.crate",
        type = "tar.gz",
        sha256 = "90bde5296fc891b0cef12a6d03ddccc162ce7b2aff54160af9338f8d40df6d19",
        strip_prefix = "rand_core-0.5.1",
        build_file = Label("//cargo/remote:rand_core-0.5.1.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_hc__0_1_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_hc/rand_hc-0.1.0.crate",
        type = "tar.gz",
        sha256 = "7b40677c7be09ae76218dc623efbf7b18e34bced3f38883af07bb75630a21bc4",
        strip_prefix = "rand_hc-0.1.0",
        build_file = Label("//cargo/remote:rand_hc-0.1.0.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_hc__0_2_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_hc/rand_hc-0.2.0.crate",
        type = "tar.gz",
        sha256 = "ca3129af7b92a17112d59ad498c6f81eaf463253766b90396d39ea7a39d6613c",
        strip_prefix = "rand_hc-0.2.0",
        build_file = Label("//cargo/remote:rand_hc-0.2.0.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_isaac__0_1_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_isaac/rand_isaac-0.1.1.crate",
        type = "tar.gz",
        sha256 = "ded997c9d5f13925be2a6fd7e66bf1872597f759fd9dd93513dd7e92e5a5ee08",
        strip_prefix = "rand_isaac-0.1.1",
        build_file = Label("//cargo/remote:rand_isaac-0.1.1.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_jitter__0_1_4",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_jitter/rand_jitter-0.1.4.crate",
        type = "tar.gz",
        sha256 = "1166d5c91dc97b88d1decc3285bb0a99ed84b05cfd0bc2341bdf2d43fc41e39b",
        strip_prefix = "rand_jitter-0.1.4",
        build_file = Label("//cargo/remote:rand_jitter-0.1.4.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_os__0_1_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_os/rand_os-0.1.3.crate",
        type = "tar.gz",
        sha256 = "7b75f676a1e053fc562eafbb47838d67c84801e38fc1ba459e8f180deabd5071",
        strip_prefix = "rand_os-0.1.3",
        build_file = Label("//cargo/remote:rand_os-0.1.3.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_pcg__0_1_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_pcg/rand_pcg-0.1.2.crate",
        type = "tar.gz",
        sha256 = "abf9b09b01790cfe0364f52bf32995ea3c39f4d2dd011eac241d2914146d0b44",
        strip_prefix = "rand_pcg-0.1.2",
        build_file = Label("//cargo/remote:rand_pcg-0.1.2.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_pcg__0_2_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_pcg/rand_pcg-0.2.1.crate",
        type = "tar.gz",
        sha256 = "16abd0c1b639e9eb4d7c50c0b8100b0d0f849be2349829c740fe8e6eb4816429",
        strip_prefix = "rand_pcg-0.2.1",
        build_file = Label("//cargo/remote:rand_pcg-0.2.1.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_xorshift__0_1_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_xorshift/rand_xorshift-0.1.1.crate",
        type = "tar.gz",
        sha256 = "cbf7e9e623549b0e21f6e97cf8ecf247c1a8fd2e8a992ae265314300b2455d5c",
        strip_prefix = "rand_xorshift-0.1.1",
        build_file = Label("//cargo/remote:rand_xorshift-0.1.1.BUILD")
    )

    _new_http_archive(
        name = "raze__rand_xorshift__0_2_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rand_xorshift/rand_xorshift-0.2.0.crate",
        type = "tar.gz",
        sha256 = "77d416b86801d23dde1aa643023b775c3a462efc0ed96443add11546cdf1dca8",
        strip_prefix = "rand_xorshift-0.2.0",
        build_file = Label("//cargo/remote:rand_xorshift-0.2.0.BUILD")
    )

    _new_http_archive(
        name = "raze__rdrand__0_4_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rdrand/rdrand-0.4.0.crate",
        type = "tar.gz",
        sha256 = "678054eb77286b51581ba43620cc911abf02758c91f93f479767aed0f90458b2",
        strip_prefix = "rdrand-0.4.0",
        build_file = Label("//cargo/remote:rdrand-0.4.0.BUILD")
    )

    _new_http_archive(
        name = "raze__redox_syscall__0_1_56",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/redox_syscall/redox_syscall-0.1.56.crate",
        type = "tar.gz",
        sha256 = "2439c63f3f6139d1b57529d16bc3b8bb855230c8efcc5d3a896c8bea7c3b1e84",
        strip_prefix = "redox_syscall-0.1.56",
        build_file = Label("//cargo/remote:redox_syscall-0.1.56.BUILD")
    )

    _new_http_archive(
        name = "raze__redox_users__0_3_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/redox_users/redox_users-0.3.1.crate",
        type = "tar.gz",
        sha256 = "4ecedbca3bf205f8d8f5c2b44d83cd0690e39ee84b951ed649e9f1841132b66d",
        strip_prefix = "redox_users-0.3.1",
        build_file = Label("//cargo/remote:redox_users-0.3.1.BUILD")
    )

    _new_http_archive(
        name = "raze__regex__1_3_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/regex/regex-1.3.1.crate",
        type = "tar.gz",
        sha256 = "dc220bd33bdce8f093101afe22a037b8eb0e5af33592e6a9caafff0d4cb81cbd",
        strip_prefix = "regex-1.3.1",
        build_file = Label("//cargo/remote:regex-1.3.1.BUILD")
    )

    _new_http_archive(
        name = "raze__regex_syntax__0_6_12",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/regex-syntax/regex-syntax-0.6.12.crate",
        type = "tar.gz",
        sha256 = "11a7e20d1cce64ef2fed88b66d347f88bd9babb82845b2b858f3edbf59a4f716",
        strip_prefix = "regex-syntax-0.6.12",
        build_file = Label("//cargo/remote:regex-syntax-0.6.12.BUILD")
    )

    _new_http_archive(
        name = "raze__rpds__0_7_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rpds/rpds-0.7.0.crate",
        type = "tar.gz",
        sha256 = "1196a0a2f52d343bd32179834273eaac7d8739f7e3f8b700227d2fa06b9a423b",
        strip_prefix = "rpds-0.7.0",
        build_file = Label("//cargo/remote:rpds-0.7.0.BUILD")
    )

    _new_http_archive(
        name = "raze__rust_argon2__0_5_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rust-argon2/rust-argon2-0.5.1.crate",
        type = "tar.gz",
        sha256 = "4ca4eaef519b494d1f2848fc602d18816fed808a981aedf4f1f00ceb7c9d32cf",
        strip_prefix = "rust-argon2-0.5.1",
        build_file = Label("//cargo/remote:rust-argon2-0.5.1.BUILD")
    )

    _new_http_archive(
        name = "raze__rustc_demangle__0_1_16",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rustc-demangle/rustc-demangle-0.1.16.crate",
        type = "tar.gz",
        sha256 = "4c691c0e608126e00913e33f0ccf3727d5fc84573623b8d65b2df340b5201783",
        strip_prefix = "rustc-demangle-0.1.16",
        build_file = Label("//cargo/remote:rustc-demangle-0.1.16.BUILD")
    )

    _new_http_archive(
        name = "raze__rustc_hash__1_0_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rustc-hash/rustc-hash-1.0.1.crate",
        type = "tar.gz",
        sha256 = "7540fc8b0c49f096ee9c961cda096467dce8084bec6bdca2fc83895fd9b28cb8",
        strip_prefix = "rustc-hash-1.0.1",
        build_file = Label("//cargo/remote:rustc-hash-1.0.1.BUILD")
    )

    _new_http_archive(
        name = "raze__rustc_version__0_2_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/rustc_version/rustc_version-0.2.3.crate",
        type = "tar.gz",
        sha256 = "138e3e0acb6c9fb258b19b67cb8abd63c00679d2851805ea151465464fe9030a",
        strip_prefix = "rustc_version-0.2.3",
        build_file = Label("//cargo/remote:rustc_version-0.2.3.BUILD")
    )

    _new_http_archive(
        name = "raze__ryu__1_0_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/ryu/ryu-1.0.2.crate",
        type = "tar.gz",
        sha256 = "bfa8506c1de11c9c4e4c38863ccbe02a305c8188e85a05a784c9e11e1c3910c8",
        strip_prefix = "ryu-1.0.2",
        build_file = Label("//cargo/remote:ryu-1.0.2.BUILD")
    )

    _new_http_archive(
        name = "raze__salsa__0_13_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/salsa/salsa-0.13.2.crate",
        type = "tar.gz",
        sha256 = "ec0865bdd9d8e614686a0cbb76979c735810131d287eb1683e91e4e64a58c387",
        strip_prefix = "salsa-0.13.2",
        build_file = Label("//cargo/remote:salsa-0.13.2.BUILD")
    )

    _new_http_archive(
        name = "raze__salsa_macros__0_13_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/salsa-macros/salsa-macros-0.13.2.crate",
        type = "tar.gz",
        sha256 = "cac182212d3a1db75ddc42399ff1461b258a694b8318ee7e0baf6c976e39efee",
        strip_prefix = "salsa-macros-0.13.2",
        build_file = Label("//cargo/remote:salsa-macros-0.13.2.BUILD")
    )

    _new_http_archive(
        name = "raze__same_file__1_0_5",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/same-file/same-file-1.0.5.crate",
        type = "tar.gz",
        sha256 = "585e8ddcedc187886a30fa705c47985c3fa88d06624095856b36ca0b82ff4421",
        strip_prefix = "same-file-1.0.5",
        build_file = Label("//cargo/remote:same-file-1.0.5.BUILD")
    )

    _new_http_archive(
        name = "raze__scopeguard__1_0_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/scopeguard/scopeguard-1.0.0.crate",
        type = "tar.gz",
        sha256 = "b42e15e59b18a828bbf5c58ea01debb36b9b096346de35d941dcb89009f24a0d",
        strip_prefix = "scopeguard-1.0.0",
        build_file = Label("//cargo/remote:scopeguard-1.0.0.BUILD")
    )

    _new_http_archive(
        name = "raze__semver__0_9_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/semver/semver-0.9.0.crate",
        type = "tar.gz",
        sha256 = "1d7eb9ef2c18661902cc47e535f9bc51b78acd254da71d375c2f6720d9a40403",
        strip_prefix = "semver-0.9.0",
        build_file = Label("//cargo/remote:semver-0.9.0.BUILD")
    )

    _new_http_archive(
        name = "raze__semver_parser__0_7_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/semver-parser/semver-parser-0.7.0.crate",
        type = "tar.gz",
        sha256 = "388a1df253eca08550bef6c72392cfe7c30914bf41df5269b68cbd6ff8f570a3",
        strip_prefix = "semver-parser-0.7.0",
        build_file = Label("//cargo/remote:semver-parser-0.7.0.BUILD")
    )

    _new_http_archive(
        name = "raze__serde__1_0_104",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/serde/serde-1.0.104.crate",
        type = "tar.gz",
        sha256 = "414115f25f818d7dfccec8ee535d76949ae78584fc4f79a6f45a904bf8ab4449",
        strip_prefix = "serde-1.0.104",
        build_file = Label("//cargo/remote:serde-1.0.104.BUILD")
    )

    _new_http_archive(
        name = "raze__serde_derive__1_0_104",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/serde_derive/serde_derive-1.0.104.crate",
        type = "tar.gz",
        sha256 = "128f9e303a5a29922045a830221b8f78ec74a5f544944f3d5984f8ec3895ef64",
        strip_prefix = "serde_derive-1.0.104",
        build_file = Label("//cargo/remote:serde_derive-1.0.104.BUILD")
    )

    _new_http_archive(
        name = "raze__serde_json__1_0_44",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/serde_json/serde_json-1.0.44.crate",
        type = "tar.gz",
        sha256 = "48c575e0cc52bdd09b47f330f646cf59afc586e9c4e3ccd6fc1f625b8ea1dad7",
        strip_prefix = "serde_json-1.0.44",
        build_file = Label("//cargo/remote:serde_json-1.0.44.BUILD")
    )

    _new_http_archive(
        name = "raze__sha2__0_8_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/sha2/sha2-0.8.0.crate",
        type = "tar.gz",
        sha256 = "7b4d8bfd0e469f417657573d8451fb33d16cfe0989359b93baf3a1ffc639543d",
        strip_prefix = "sha2-0.8.0",
        build_file = Label("//cargo/remote:sha2-0.8.0.BUILD")
    )

    _new_http_archive(
        name = "raze__siphasher__0_2_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/siphasher/siphasher-0.2.3.crate",
        type = "tar.gz",
        sha256 = "0b8de496cf83d4ed58b6be86c3a275b8602f6ffe98d3024a869e124147a9a3ac",
        strip_prefix = "siphasher-0.2.3",
        build_file = Label("//cargo/remote:siphasher-0.2.3.BUILD")
    )

    _new_http_archive(
        name = "raze__slab__0_4_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/slab/slab-0.4.2.crate",
        type = "tar.gz",
        sha256 = "c111b5bd5695e56cffe5129854aa230b39c93a305372fdbb2668ca2394eea9f8",
        strip_prefix = "slab-0.4.2",
        build_file = Label("//cargo/remote:slab-0.4.2.BUILD")
    )

    _new_http_archive(
        name = "raze__smallvec__0_6_13",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/smallvec/smallvec-0.6.13.crate",
        type = "tar.gz",
        sha256 = "f7b0758c52e15a8b5e3691eae6cc559f08eee9406e548a4477ba4e67770a82b6",
        strip_prefix = "smallvec-0.6.13",
        build_file = Label("//cargo/remote:smallvec-0.6.13.BUILD")
    )

    _new_http_archive(
        name = "raze__static_assertions__0_3_4",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/static_assertions/static_assertions-0.3.4.crate",
        type = "tar.gz",
        sha256 = "7f3eb36b47e512f8f1c9e3d10c2c1965bc992bd9cdb024fa581e2194501c83d3",
        strip_prefix = "static_assertions-0.3.4",
        build_file = Label("//cargo/remote:static_assertions-0.3.4.BUILD")
    )

    _new_http_archive(
        name = "raze__string_cache__0_7_5",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/string_cache/string_cache-0.7.5.crate",
        type = "tar.gz",
        sha256 = "89c058a82f9fd69b1becf8c274f412281038877c553182f1d02eb027045a2d67",
        strip_prefix = "string_cache-0.7.5",
        build_file = Label("//cargo/remote:string_cache-0.7.5.BUILD")
    )

    _new_http_archive(
        name = "raze__string_cache_codegen__0_4_4",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/string_cache_codegen/string_cache_codegen-0.4.4.crate",
        type = "tar.gz",
        sha256 = "f0f45ed1b65bf9a4bf2f7b7dc59212d1926e9eaf00fa998988e420fd124467c6",
        strip_prefix = "string_cache_codegen-0.4.4",
        build_file = Label("//cargo/remote:string_cache_codegen-0.4.4.BUILD")
    )

    _new_http_archive(
        name = "raze__string_cache_shared__0_3_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/string_cache_shared/string_cache_shared-0.3.0.crate",
        type = "tar.gz",
        sha256 = "b1884d1bc09741d466d9b14e6d37ac89d6909cbcac41dd9ae982d4d063bbedfc",
        strip_prefix = "string_cache_shared-0.3.0",
        build_file = Label("//cargo/remote:string_cache_shared-0.3.0.BUILD")
    )

    _new_http_archive(
        name = "raze__strsim__0_9_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/strsim/strsim-0.9.3.crate",
        type = "tar.gz",
        sha256 = "6446ced80d6c486436db5c078dde11a9f73d42b57fb273121e160b84f63d894c",
        strip_prefix = "strsim-0.9.3",
        build_file = Label("//cargo/remote:strsim-0.9.3.BUILD")
    )

    _new_http_archive(
        name = "raze__syn__1_0_11",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/syn/syn-1.0.11.crate",
        type = "tar.gz",
        sha256 = "dff0acdb207ae2fe6d5976617f887eb1e35a2ba52c13c7234c790960cdad9238",
        strip_prefix = "syn-1.0.11",
        build_file = Label("//cargo/remote:syn-1.0.11.BUILD")
    )

    _new_http_archive(
        name = "raze__synstructure__0_12_3",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/synstructure/synstructure-0.12.3.crate",
        type = "tar.gz",
        sha256 = "67656ea1dc1b41b1451851562ea232ec2e5a80242139f7e679ceccfb5d61f545",
        strip_prefix = "synstructure-0.12.3",
        build_file = Label("//cargo/remote:synstructure-0.12.3.BUILD")
    )

    _new_http_archive(
        name = "raze__term__0_5_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/term/term-0.5.2.crate",
        type = "tar.gz",
        sha256 = "edd106a334b7657c10b7c540a0106114feadeb4dc314513e97df481d5d966f42",
        strip_prefix = "term-0.5.2",
        build_file = Label("//cargo/remote:term-0.5.2.BUILD")
    )

    _new_http_archive(
        name = "raze__termcolor__1_0_5",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/termcolor/termcolor-1.0.5.crate",
        type = "tar.gz",
        sha256 = "96d6098003bde162e4277c70665bd87c326f5a0c3f3fbfb285787fa482d54e6e",
        strip_prefix = "termcolor-1.0.5",
        build_file = Label("//cargo/remote:termcolor-1.0.5.BUILD")
    )

    _new_http_archive(
        name = "raze__thread_local__0_3_6",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/thread_local/thread_local-0.3.6.crate",
        type = "tar.gz",
        sha256 = "c6b53e329000edc2b34dbe8545fd20e55a333362d0a321909685a19bd28c3f1b",
        strip_prefix = "thread_local-0.3.6",
        build_file = Label("//cargo/remote:thread_local-0.3.6.BUILD")
    )

    _new_http_archive(
        name = "raze__toml__0_5_5",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/toml/toml-0.5.5.crate",
        type = "tar.gz",
        sha256 = "01d1404644c8b12b16bfcffa4322403a91a451584daaaa7c28d3152e6cbc98cf",
        strip_prefix = "toml-0.5.5",
        build_file = Label("//cargo/remote:toml-0.5.5.BUILD")
    )

    _new_http_archive(
        name = "raze__typed_arena__1_7_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/typed-arena/typed-arena-1.7.0.crate",
        type = "tar.gz",
        sha256 = "a9b2228007eba4120145f785df0f6c92ea538f5a3635a612ecf4e334c8c1446d",
        strip_prefix = "typed-arena-1.7.0",
        build_file = Label("//cargo/remote:typed-arena-1.7.0.BUILD")
    )

    _new_http_archive(
        name = "raze__typenum__1_11_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/typenum/typenum-1.11.2.crate",
        type = "tar.gz",
        sha256 = "6d2783fe2d6b8c1101136184eb41be8b1ad379e4657050b8aaff0c79ee7575f9",
        strip_prefix = "typenum-1.11.2",
        build_file = Label("//cargo/remote:typenum-1.11.2.BUILD")
    )

    _new_http_archive(
        name = "raze__unicode_segmentation__1_6_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/unicode-segmentation/unicode-segmentation-1.6.0.crate",
        type = "tar.gz",
        sha256 = "e83e153d1053cbb5a118eeff7fd5be06ed99153f00dbcd8ae310c5fb2b22edc0",
        strip_prefix = "unicode-segmentation-1.6.0",
        build_file = Label("//cargo/remote:unicode-segmentation-1.6.0.BUILD")
    )

    _new_http_archive(
        name = "raze__unicode_xid__0_1_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/unicode-xid/unicode-xid-0.1.0.crate",
        type = "tar.gz",
        sha256 = "fc72304796d0818e357ead4e000d19c9c174ab23dc11093ac919054d20a6a7fc",
        strip_prefix = "unicode-xid-0.1.0",
        build_file = Label("//cargo/remote:unicode-xid-0.1.0.BUILD")
    )

    _new_http_archive(
        name = "raze__unicode_xid__0_2_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/unicode-xid/unicode-xid-0.2.0.crate",
        type = "tar.gz",
        sha256 = "826e7639553986605ec5979c7dd957c7895e93eabed50ab2ffa7f6128a75097c",
        strip_prefix = "unicode-xid-0.2.0",
        build_file = Label("//cargo/remote:unicode-xid-0.2.0.BUILD")
    )

    _new_http_archive(
        name = "raze__vcpkg__0_2_8",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/vcpkg/vcpkg-0.2.8.crate",
        type = "tar.gz",
        sha256 = "3fc439f2794e98976c88a2a2dafce96b930fe8010b0a256b3c2199a773933168",
        strip_prefix = "vcpkg-0.2.8",
        build_file = Label("//cargo/remote:vcpkg-0.2.8.BUILD")
    )

    _new_http_archive(
        name = "raze__vec_map__0_8_1",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/vec_map/vec_map-0.8.1.crate",
        type = "tar.gz",
        sha256 = "05c78687fb1a80548ae3250346c3db86a80a7cdd77bda190189f2d0a0987c81a",
        strip_prefix = "vec_map-0.8.1",
        build_file = Label("//cargo/remote:vec_map-0.8.1.BUILD")
    )

    _new_http_archive(
        name = "raze__walkdir__2_2_9",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/walkdir/walkdir-2.2.9.crate",
        type = "tar.gz",
        sha256 = "9658c94fa8b940eab2250bd5a457f9c48b748420d71293b165c8cdbe2f55f71e",
        strip_prefix = "walkdir-2.2.9",
        build_file = Label("//cargo/remote:walkdir-2.2.9.BUILD")
    )

    _new_http_archive(
        name = "raze__wasi__0_7_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/wasi/wasi-0.7.0.crate",
        type = "tar.gz",
        sha256 = "b89c3ce4ce14bdc6fb6beaf9ec7928ca331de5df7e5ea278375642a2f478570d",
        strip_prefix = "wasi-0.7.0",
        build_file = Label("//cargo/remote:wasi-0.7.0.BUILD")
    )

    _new_http_archive(
        name = "raze__winapi__0_3_8",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/winapi/winapi-0.3.8.crate",
        type = "tar.gz",
        sha256 = "8093091eeb260906a183e6ae1abdba2ef5ef2257a21801128899c3fc699229c6",
        strip_prefix = "winapi-0.3.8",
        build_file = Label("//cargo/remote:winapi-0.3.8.BUILD")
    )

    _new_http_archive(
        name = "raze__winapi_i686_pc_windows_gnu__0_4_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/winapi-i686-pc-windows-gnu/winapi-i686-pc-windows-gnu-0.4.0.crate",
        type = "tar.gz",
        sha256 = "ac3b87c63620426dd9b991e5ce0329eff545bccbbb34f3be09ff6fb6ab51b7b6",
        strip_prefix = "winapi-i686-pc-windows-gnu-0.4.0",
        build_file = Label("//cargo/remote:winapi-i686-pc-windows-gnu-0.4.0.BUILD")
    )

    _new_http_archive(
        name = "raze__winapi_util__0_1_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/winapi-util/winapi-util-0.1.2.crate",
        type = "tar.gz",
        sha256 = "7168bab6e1daee33b4557efd0e95d5ca70a03706d39fa5f3fe7a236f584b03c9",
        strip_prefix = "winapi-util-0.1.2",
        build_file = Label("//cargo/remote:winapi-util-0.1.2.BUILD")
    )

    _new_http_archive(
        name = "raze__winapi_x86_64_pc_windows_gnu__0_4_0",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/winapi-x86_64-pc-windows-gnu/winapi-x86_64-pc-windows-gnu-0.4.0.crate",
        type = "tar.gz",
        sha256 = "712e227841d057c1ee1cd2fb22fa7e5a5461ae8e48fa2ca79ec42cfc1931183f",
        strip_prefix = "winapi-x86_64-pc-windows-gnu-0.4.0",
        build_file = Label("//cargo/remote:winapi-x86_64-pc-windows-gnu-0.4.0.BUILD")
    )

    _new_http_archive(
        name = "raze__wincolor__1_0_2",
        url = "https://crates-io.s3-us-west-1.amazonaws.com/crates/wincolor/wincolor-1.0.2.crate",
        type = "tar.gz",
        sha256 = "96f5016b18804d24db43cebf3c77269e7569b8954a8464501c216cc5e070eaa9",
        strip_prefix = "wincolor-1.0.2",
        build_file = Label("//cargo/remote:wincolor-1.0.2.BUILD")
    )

