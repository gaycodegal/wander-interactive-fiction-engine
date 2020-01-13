def _impl(repository_ctx):
    # Create the build
    repository_ctx.file("BUILD", """
exports_files(
    ["vars.bzl"],
    visibility:["//visibility:public"],
)
""")

    # Create vars.bzl
    var_defs = ["%s = %s" % (var, repr(repository_ctx.os.environ.get(var, None))) for var in repository_ctx.attr.vars]
    repository_ctx.file("vars.bzl", "\n".join(var_defs))

env_defined_repo = repository_rule(
    implementation = _impl,
    local = True,
    configure = True,
    attrs = {"vars": attr.string_list(mandatory = True)},
)
