load("@io_bazel_rules_rust//rust:rust.bzl", "rust_doc")

def rust_docs(name, deps, **kwargs):
    """Builds docs for all rust libraries and binaries

    Args:
      name: A name for the rule.
      deps: The deps to create a rust_doc rule with.
      kwargs: Any remaining rules to pass to the rust docs.
    """
    for dep in deps:
        rust_doc(
            name = '_'.join(dep.split('/')),
            dep = dep,
            **kwargs
        )
    native.filegroup(
        name = name,
        srcs = [
            ":" + '_'.join(dep.split('/')) for dep in deps
        ]
    )
