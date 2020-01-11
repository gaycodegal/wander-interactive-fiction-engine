workspace(name="wander_interactive_fiction_engine")

load("//bzl:defines.bzl", "env_defined_repo")
env_defined_repo(name="environment", vars=["QT_HOME"])
load("@environment//:vars.bzl", "QT_HOME")

load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")

git_repository(
    name = "build_bazel_rules_nodejs",
    remote = "https://github.com/bazelbuild/rules_nodejs.git",
    tag = "0.15.1",  # check for the latest tag when you install
)

load("@build_bazel_rules_nodejs//:package.bzl", "rules_nodejs_dependencies")

rules_nodejs_dependencies()

load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories")

# NOTE: this rule installs nodejs, npm, and yarn, but does NOT install
# your npm dependencies into your node_modules folder.
# You must still run the package manager to do this.
node_repositories(package_json = ["//:package.json"])

load("@build_bazel_rules_nodejs//:defs.bzl", "npm_install")

yarn_install(
    name = "npm",
    package_json = "//:package.json",
    package_lock = "//:package-lock.json",
)

#---------

git_repository(
    name = "io_bazel_rules_webtesting",
    remote = "https://github.com/bazelbuild/rules_webtesting.git",
    tag = "0.2.1",
)

http_archive(
    name = "build_bazel_rules_typescript",
    strip_prefix = "rules_typescript-0.20.3",
    url = "https://github.com/bazelbuild/rules_typescript/archive/0.20.3.zip",
)

# Fetch our Bazel dependencies that aren't distributed on npm
load("@build_bazel_rules_typescript//:package.bzl", "rules_typescript_dependencies")

rules_typescript_dependencies()

load("@build_bazel_rules_typescript//:defs.bzl", "ts_setup_workspace")

ts_setup_workspace()

# sass
http_archive(
    name = "io_bazel_rules_sass",
    strip_prefix = "rules_sass-1.14.3",
    url = "https://github.com/bazelbuild/rules_sass/archive/1.14.3.zip",
)

load("@io_bazel_rules_sass//sass:sass_repositories.bzl", "sass_repositories")

sass_repositories()
# sass end

http_archive(
    name = "io_bazel_rules_go",
    sha256 = "7519e9e1c716ae3c05bd2d984a42c3b02e690c5df728dc0a84b23f90c355c5a1",
    urls = ["https://github.com/bazelbuild/rules_go/releases/download/0.15.4/rules_go-0.15.4.tar.gz"],
)

load("@io_bazel_rules_go//go:def.bzl", "go_register_toolchains", "go_rules_dependencies")

go_rules_dependencies()

go_register_toolchains()

# Setup web testing, choose browsers we can test on
load("@io_bazel_rules_webtesting//web:repositories.bzl", "browser_repositories", "web_test_repositories")

web_test_repositories()

browser_repositories(
    chromium = True,
)
#---------

### buidifier
http_archive(
    name = "com_github_bazelbuild_buildtools",
    strip_prefix = "buildtools-7926f6cd8f2568556b0efc23530743df4278e0fe",
    url = "https://github.com/bazelbuild/buildtools/archive/7926f6cd8f2568556b0efc23530743df4278e0fe.zip",
)

load("@com_github_bazelbuild_buildtools//buildifier:deps.bzl", "buildifier_dependencies")

buildifier_dependencies()