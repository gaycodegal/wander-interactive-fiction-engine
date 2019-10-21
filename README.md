# Wander Interactive Fiction Engine

## Dependencies

[bazel.build](https://bazel.build)

    cargo install cargo-vendor
    cargo install cargo-raze

## Setup

    cd cargo
	sh ../scripts/init-dependencies.sh
	
## Running

    bazel run //rust/game

## Rust

### Add a crate

in //cargo

    cargo add <crate>
	sh ../scripts/init-dependencies.sh
