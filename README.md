# Wander Interactive Fiction Engine

Wander is an engine in progress for making text adventures. It supports Context Free Grammars, which are parsed using a modified CYK algorithm.

## Dependencies

- [Rust (1.38)](https://www.rust-lang.org/tools/install)
- [Qt (5.12.5)](https://www.qt.io/)
- [bazel.build](https://bazel.build)

Also install cargo-vendor & cargo-raze

    cargo install cargo-vendor
    cargo install cargo-raze

## Setup

	bazel sync --configure
    cd cargo
	sh ../scripts/init-dependencies.sh
	
## Running

    bazel run //rust/game

## Rust

### Add a crate

	cd cargo
    cargo add <crate>
	sh ../scripts/init-dependencies.sh

## License

MIT License. See [the LICENSE](./LICENSE) for more. [IARC](https://opensource.google.com/docs/iarc/) permission received.
