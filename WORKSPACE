workspace(name="wander_interactive_fiction_engine")
load("//bzl:defines.bzl", "env_defined_repo")
env_defined_repo(name="environment", vars=["QT_HOME"])
load("@environment//:vars.bzl", "QT_HOME")

new_local_repository(
    name = "qt",
    path = QT_HOME,
    build_file = "BUILD.qt"
)
