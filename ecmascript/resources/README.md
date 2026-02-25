# WASM SHA-2 (Rust → WebAssembly)

![NPM Downloads](https://img.shields.io/npm/dw/@apeleghq/sha2?style=flat-square)

A WebAssembly build of Rust SHA-2 implementations, exposed to
JavaScript/TypeScript. The package provides streaming and one-shot hashers for
SHA-224, SHA-256, SHA-384, SHA-512 and SHA-512/256 (variant availability depends
on build features). A TypeScript declaration (`.d.ts`) file is included for a
typed API.

---

## 🚀 Features

- Streaming and one-shot hashing APIs.
- Zero runtime dependencies — pure traspiled WASM + light JS glue.
- Small, efficient heap sharing between JS and transpiled WASM.
- Optional serialisation/deserialisation of internal state.
- TypeScript definitions included.

## ⚙️ Installation

Install from npm or yarn:

```sh
npm install @apeleghq/sha2
```

or

```sh
yarn add @apeleghq/sha2
```

## 📦 Package contents

- Compiled WebAssembly module (.wasm)
- JS/ESM glue to load the module
- TypeScript declaration file (.d.ts) — the API described below
- README, LICENSE, tests

## 🔌 API Overview

The module exports a single async default function that initialises the WASM module and returns factories for the enabled SHA-2 variants.

Signature (from the .d.ts):

- Default export: `async function (): Promise<Sha2Factories<...>>`

Returned object contains one property per enabled algorithm (examples: `sha256`, `sha512`, etc.). Each property is a constructor/factory function with these behaviours:

Hash instance methods:
- `update(data: ArrayBuffer | ArrayBufferView, scrub?: boolean): void`
- `finalize(scrub?: boolean): ArrayBuffer`
- `reset(): void`
- `digest(data: ArrayBuffer | ArrayBufferView, scrub?: boolean): ArrayBuffer` —
  one-shot convenience (throws if instance is streaming)

Optional (when serialize feature enabled):
- `serialize(scrub?: boolean): ArrayBuffer`

Constructors may also accept a serialized state to resume:
- `constructor(serializedData?: ArrayBuffer | ArrayBufferView | null, scrub?: boolean)`

See the bundled `.d.ts` for exact types.

## 📚 Usage

Basic one-shot hashing (example):

```javascript
import sha2 from '@apeleghq/sha2';

const factories = await sha2();
const hasher = factories.sha256();
const digest = hasher.digest(new Uint8Array([1,2,3]));
// `digest` is an ArrayBuffer containing the raw hash bytes
```

Streaming example:

```javascript
import sha2 from '@apeleghq/sha2';

const factories = await sha2();
const h = factories.sha512();
h.update(new Uint8Array(chunk1));
h.update(new Uint8Array(chunk2));
const result = h.finalize(); // ArrayBuffer
h.reset(); // reuse
```

Serialisation / resuming:

```javascript
import sha2 from '@apeleghq/sha2';

const factories = await sha2();
const h = factories.sha256();
h.update(part1);
const state = h.serialize(); // ArrayBuffer
// ...persist or transfer state...
const resumed = factories.sha256(state);
resumed.update(part2);
const digest = resumed.finalize();
```

Notes:
- All methods accept `ArrayBuffer` or any `ArrayBufferView` (`Uint8Array`,
  `DataView`, etc.).
- The optional `scrub` boolean (when present) indicates whether internal buffers
  should be zeroed after use to reduce memory-resident sensitive data.

### Exports

Apart from the main export at the root (`@apeleghq/sha2`), there are additional
exports based on specific build-time features. This enables selecting just those
features that are needed to reduce bundle size.

#### Example


```javascript
// Just some 
import sha2_ɑ from '@apeleghq/sha2/sha256+sha384+streaming';
import sha2_β from '@apeleghq/sha2/sha384+deserialize+serialize+streaming';

const factories_ɑ = await sha2_ɑ();
const h1 = factories_ɑ.sha256(); // ✅ This works
const h2 = factories_ɑ.sha384(); // ✅ This works

const h3 = factories_ɑ.sha512(); // ❌ This doesn't work --- no `sha512` feature
// ❌ This doesn't work --- no `deserialize` feature
const h4 = factories_ɑ.sha384(previouslyExportedState);
h2.serialize(); // ❌ This doesn't work --- no `serialize` feature

const factories_β = await sha2_β();
const h5 = factories_β.sha256(); // ❌ This doesn't work --- no `sha256` feature
// ❌ This doesn't work --- no `sha256` feature
const h6 = factories_β.sha256(previouslyExportedState);

const h7 = factories_β.sha384(); // ✅ This works
const h8 = factories_β.sha384(previouslyExportedState); // ✅ This works
h7.serialize(); // ✅ This works
```

## ✅ Recommended usage

- Call the default export once at startup and reuse the returned factories.
- For repeated hashing of many inputs, create and reuse instances or reset
  instances to avoid repeated allocations.
- Use the TypeScript definitions included for full type safety.

## 🧪 Example: Node + ESM

package.json:
```json
{
  "type": "module"
}
```

app.js:
```javascript
import sha2 from '@apeleghq/sha2';

const factories = await sha2();
const h = factories.sha256();
const digest = h.digest(new TextEncoder().encode('hello'));
console.log(Buffer.from(digest).toString('hex'));
```

## ⚙️ Build features

Build-time feature flags (available via `import.meta.features` in the bundling
environment) control which algorithms and optional capabilities are compiled in:

- `sha224`, `sha256`, `sha384`, `sha512`, `sha512_256`
- `serialize`, `deserialize` — enables `serialize`/`deserialize` APIs
  (for importing and exporting the hasher state)

The TypeScript declaration mirrors which factories are present according to the
build features.

## 📦 Distribution targets

- ESM (recommended)
- Node.js and browser-compatible WASM + light JS loader included

## 🤝 Contributing

Contributions welcome. Open issues or pull requests in the repository.

## 📜 License

This project is released under the ISC license. See the `LICENSE` file for
details.
