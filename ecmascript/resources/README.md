# WASM SHA-2 (Rust → WebAssembly → JavaScript)

![NPM Downloads](https://img.shields.io/npm/dw/@apeleghq/sha2?style=flat-square)

A WebAssembly build of Rust SHA-2 implementations, exposed to
JavaScript/TypeScript. The package provides streaming and one-shot hashers for
SHA-224, SHA-256, SHA-384, SHA-512 and SHA-512/256 (variant availability depends
on build features). A TypeScript declaration (`.d.ts`) file is included for a
typed API.

---

## 🚀 Features

- Streaming and one-shot hashing APIs.
- Zero runtime dependencies — pure transpiled WASM + light JS glue.
- Small, efficient heap sharing between JS and transpiled WASM.
- Optional serialisation/deserialisation of internal state.
- TypeScript definitions included.
- ESM and UMD exports.

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

- Compiled WebAssembly module (.wasm) in two versions:
  * Transpiled to JavaScript
  * As native WASM objects (`/wasm` export path)
- JS/ESM glue to load the module
- TypeScript declaration file (.d.ts) — the API described below

## 🔌 API Overview

The module exports a single async default function that initialises the WASM
module and returns factories for the enabled SHA-2 variants.

Signature (from the `.d.ts`):

- Default export: `async function (): Promise<Sha2Factories<...>>`

Returned object contains one property per enabled algorithm (examples: `sha256`, `sha512`, etc.). Each property is a constructor/factory function with these behaviours:

Hash instance methods:
- `update(data: ArrayBufferLike | ArrayBufferView, scrub?: boolean): void`
- `finalize(scrub?: boolean): ArrayBufferLike`
- `reset(): void`
- `digest(data: ArrayBufferLike | ArrayBufferView, scrub?: boolean): ArrayBuffer` —
  one-shot convenience (throws if instance is streaming)

Optional (when `serialize` feature enabled):
- `serialize(scrub?: boolean): ArrayBufferLike`

Constructors may also accept a serialized state to resume:
- `constructor(serializedData?: ArrayBufferLike | ArrayBufferView | null, scrub?: boolean)`

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
import sha2 from '@apeleghq/sha2/wasm';

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

#### WASM exports

The `/wasm` export path prefix can be used to select native WASM instead of WASM
transpiled to JS. For example:

- `@apeleghq/sha2` -> `@apeleghq/sha2/wasm`
- `@apeleghq/sha2/sha256+streaming` -> `@apeleghq/sha2/wasm/sha256+streaming`

#### Example

```javascript
import sha2_ɑ from '@apeleghq/sha2/wasm/sha256+sha384+streaming';
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

## Benchmark

<details>
<summary>
Benchmark results comparing various NPM packages and `SubtleCrypto`
</summary>

Generated using the project under the `ecmascript/benchmark` directory in
Node.js v24.14.0. Like all benchmarks, results are estimative and dependent on
the specific environment they're generated in.

> [!IMPORTANT]
> All results are experimental and should not be used for production
> decision-making.

### Critical limitations

- **Environment-Specific**: Results were measured on:
  - Hardware: Google Axion (Arm64) -- `c4a-standard-2` (2 vCPUs, 8 GB memory)
  - OS: Debian GNU/Linux 13 (trixie)
  - Node.js: v24.14.1
- **Methodology**:
  - Tests ran with `4096 iterations` per method:
    * 32 trials of 128 runs (plus 64 warm up runs)
  - Measured using `benchmark/src/index.js`
- **Key Caveats**:
  1. Results **do not account for real-world network delays or memory constraints**.
  2. This benchmark focuses on *raw execution speed*, not security or
     correctness.
  3. Results do not account for conversions between different output formats
     (for example, from `Uint8Array` to `string`).

### Results

```
================================================================================
SHA-256 BENCHMARK RESULTS                          (All values in ms)
================================================================================

Buffer Size: 1.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
hash-wasm                     18.074         226618.11   221.31     1.00      ⭐
@apeleghq/sha2 (WASM)         19.432         210781.46   205.84     1.08
sha256-uint8array             23.255         176133.56   172.01     1.29
@apeleghq/sha2 (ES)           25.650         159689.52   155.95     1.42
fast-sha256                   27.330         149874.43   146.36     1.51
@aws-crypto/sha256-js         42.570          96217.44    93.96     2.36
js-sha256                     52.060          78678.69    76.83     2.88
sha.js                        52.124          78582.08    76.74     2.88
SubtleCrypto.digest           70.798          57854.52    56.50     3.92
jssha                        101.878          40205.08    39.26     5.64
================================================================================

Buffer Size: 8.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           91.022         44999.99    351.56     1.00      ⭐
hash-wasm                    115.810         35368.33    276.32     1.27
@apeleghq/sha2 (WASM)        121.449         33726.21    263.49     1.33
fast-sha256                  153.159         26743.54    208.93     1.68
@apeleghq/sha2 (ES)          154.262         26552.31    207.44     1.69
sha256-uint8array            168.389         24324.62    190.04     1.85
@aws-crypto/sha256-js        248.062         16512.03    129.00     2.73
sha.js                       376.423         10881.38     85.01     4.14
js-sha256                    378.874         10810.97     84.46     4.16
jssha                        660.636          6200.09     48.44     7.26
================================================================================

Buffer Size: 64.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           212.132        19308.76    1206.80     1.00     ⭐
hash-wasm                     906.084         4520.55     282.53     4.27
@apeleghq/sha2 (WASM)         942.994         4343.61     271.48     4.45
fast-sha256                  1157.807         3537.72     221.11     5.46
@apeleghq/sha2 (ES)          1188.436         3446.55     215.41     5.60
sha256-uint8array            1331.342         3076.60     192.29     6.28
@aws-crypto/sha256-js        1923.212         2129.77     133.11     9.07
sha.js                       2980.524         1374.26      85.89    14.05
js-sha256                    2998.105         1366.20      85.39    14.13
jssha                        5328.185          768.74      48.05    25.12
================================================================================

Buffer Size: 128.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest            358.073       11439.00    1429.88     1.00     ⭐
hash-wasm                     1807.744        2265.81     283.23     5.05
@apeleghq/sha2 (WASM)         1881.731        2176.72     272.09     5.26
fast-sha256                   2305.384        1776.71     222.09     6.44
@apeleghq/sha2 (ES)           2372.118        1726.73     215.84     6.62
sha256-uint8array             2659.901        1539.91     192.49     7.43
@aws-crypto/sha256-js         3878.327        1056.13     132.02    10.83
sha.js                        5955.954         687.72      85.96    16.63
js-sha256                     5988.689         683.96      85.49    16.72
jssha                        10621.935         385.62      48.20    29.66
================================================================================

Buffer Size: 1.00 MiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           2467.996       1659.65     1659.65     1.00     ⭐
hash-wasm                    14453.133        283.40      283.40     5.86
@apeleghq/sha2 (WASM)        15043.719        272.27      272.27     6.10
fast-sha256                  18388.332        222.75      222.75     7.45
@apeleghq/sha2 (ES)          18968.384        215.94      215.94     7.69
sha256-uint8array            21266.053        192.61      192.61     8.62
@aws-crypto/sha256-js        30974.423        132.24      132.24    12.55
sha.js                       47667.762         85.93       85.93    19.31
js-sha256                    47872.716         85.56       85.56    19.40
jssha                        88314.236         46.38       46.38    35.78
================================================================================

Buffer Size: 8.00 MiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           19864.614      206.20      1649.57     1.00     ⭐
hash-wasm                    116664.760       35.11       280.87     5.87
@apeleghq/sha2 (WASM)        121025.148       33.84       270.75     6.09
fast-sha256                  147148.591       27.84       222.69     7.41
@apeleghq/sha2 (ES)          152404.195       26.88       215.01     7.67
sha256-uint8array            170047.870       24.09       192.70     8.56
@aws-crypto/sha256-js        247465.624       16.55       132.41    12.46
sha.js                       381183.273       10.75        85.96    19.19
js-sha256                    382980.849       10.70        85.56    19.28
jssha                        685976.680        5.97        47.77    34.53
================================================================================

================================================================================
SUMMARY: Fastest package by buffer size
================================================================================
Buffer Size          Fastest Package
--------------------------------------------------------------------------------
1.00 KiB             hash-wasm
8.00 KiB             SubtleCrypto.digest
64.00 KiB            SubtleCrypto.digest
128.00 KiB           SubtleCrypto.digest
1.00 MiB             SubtleCrypto.digest
8.00 MiB             SubtleCrypto.digest
================================================================================
```
</details>

## ⚙️ Build features

Build-time feature flags (available via `import.meta.features` in the bundling
environment) control which algorithms and optional capabilities are compiled in:

- `sha224`, `sha256`, `sha384`, `sha512`, `sha512_256`
- `serialize`, `deserialize` — enables `serialize` / `deserialize` APIs,
  respectively (for importing and exporting the hasher state)

The TypeScript declaration mirrors which factories are present according to the
build features.

## 🤝 Contributing

Contributions welcome. Open issues or pull requests in the repository.

## 📜 License

This project is released under the ISC license. See the `LICENSE` file for
details.
