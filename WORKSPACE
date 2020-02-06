workspace(
    name = "wife",
)

load("//bzl:defines.bzl", "env_defined_repo")
env_defined_repo(name="environment", vars=["GOOGLETEST_HOME"])
load("@environment//:vars.bzl", "GOOGLETEST_HOME")
''' print("var", GOOGLETEST_HOME)
local_repository(
    name = "googletest",
    path = GOOGLETEST_HOME,
)
 '''