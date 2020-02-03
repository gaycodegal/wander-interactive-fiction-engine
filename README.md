# Wander Interactive Fiction Engine

Wander is an engine in progress for making text adventures. It supports Context Free Grammars, which are parsed using a modified CYK algorithm.

## Dependencies

- C++ 17
- [bazel.build](https://bazel.build)
- [sqlite3 (3.30.1)](https://www.sqlite.org/index.html)

Also install cargo-vendor & cargo-raze

    cargo install cargo-vendor
    cargo install cargo-raze

## Setup

	bazel sync --configure
	
## Running

    bazel run //engine/game

## License

MIT License. See [the LICENSE](./LICENSE) for more. [IARC](https://opensource.google.com/docs/iarc/) permission received.
