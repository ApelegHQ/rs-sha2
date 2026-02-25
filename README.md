## rs-sha2

[![NPM Downloads](https://img.shields.io/npm/dw/@apeleghq/sha2?style=flat-square)](https://www.npmjs.com/package/@apeleghq/sha2)

A multi-target implementation of the SHA‑2 family (SHA‑224, SHA‑256, SHA‑384,
SHA‑512, SHA‑512/256) implemented in Rust and distributed for JavaScript via
WebAssembly. This repository contains the Rust sources, C helper crate, WASM
bridge and an ecmascript package that bundles multiple transpiled WASM builds
and TypeScript declarations for easy JS/TS usage.

- Repository: https://github.com/apeleghq/rs-sha2
- Package (JS/WASM): `@apeleghq/sha2`
- License: ISC (see LICENSE)

## Contents

- c/ — small C helper crate used during builds
- rust/ — Rust library and integration code
- wasm/ — wasm-target Cargo crate
- ecmascript/ — JS/TS wrappers, builds, tests and published packages
- target/ — local build output
- Cargo.toml / Cargo.lock — workspace manifests

## Features

- Supported algorithms: **sha224, sha256, sha384, sha512, sha512_256**
- Streaming and one-shot hash APIs
- Optional serialize / deserialize of internal state (build-time feature)
- Multiple pre-built JS/WASM bundles in ecmascript/dist and ecmascript/build
- TypeScript definitions included (types.d.mts / types.d.cts)

## Quick JS / WASM usage (Node or browser)

Install the published package:

```sh
npm install @apeleghq/sha2
# or
yarn add @apeleghq/sha2
```

Example (ESM, Node or browser with bundler):

```javascript
import sha2 from '@apeleghq/sha2';

const factories = await sha2(); // initializes the WASM module
const hasher = factories.sha256(); // create SHA-256 instance

// one-shot
const digestBuf = hasher.digest(new TextEncoder().encode('hello')); // ArrayBuffer
console.log(Buffer.from(digestBuf).toString('hex'));

// streaming
hasher.update(new TextEncoder().encode('part1'));
hasher.update(new TextEncoder().encode('part2'));
const streamingDigest = hasher.finalize();
console.log(Buffer.from(streamingDigest).toString('hex'));
```

Serialisation (available when built with the serialize feature):

```javascript
const h = factories.sha256();
h.update(chunkA);
const state = h.serialize(); // ArrayBuffer
const resumed = factories.sha256(state);
resumed.update(chunkB);
const finalDigest = resumed.finalize();
```

See ecmascript/dist for pre-built variants (examples: sha256+streaming.mjs, sha256+sha384+streaming.mjs, etc.) and the accompanying .d.mts/.d.cts declaration files.

## Development

Requirements
- Rust (stable)
- `wasm32v1-none` target (for wasm builds)
- Node.js (for ecmascript packaging and tests)
- npm or yarn (for ecmascript packaging and tests)

Common tasks

- Build Rust library:
  - `cargo build`
- Build wasm target (from workspace root):
  - `cargo build -p wasm --target wasm32v1-none --release`
- Build JS bundles (inside `ecmascript`):
  - `cd ecmascript`
  - `npm install`
  - `npm run build`
- Run JS tests:
  - `cd ecmascript`
  - `npm test`

The ecmascript build process produces multiple bundles in `ecmascript/build` and
a distilled publishable package in `ecmascript/dist`.

## Testing

- Unit tests for JS/TS live under `ecmascript/tests` and run via the
  `ecmascript` package test script.
- Rust tests live in their respective crates and run with `cargo test`.

## Packaging & Releases

Build scripts generate multiple bundles for different feature combinations —-
choose the bundle matching the features you need (`streaming`,
`serialize`/`deserialize`, specific algorithm set).

## Contributing

Contributions welcome. Prefer small, focused pull requests and include tests for
changes affecting behaviour or serialization. Open issues for discussion before
large design changes.

## License

ISC — see `LICENSE` file.
