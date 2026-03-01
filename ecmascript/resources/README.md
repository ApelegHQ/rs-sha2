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
  - OS: Debian GNU/Linux 12 (bookworm)
  - Node.js: v24.14.0
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
hash-wasm                     17.821         229844.87   224.46     1.00      ⭐
@apeleghq/sha2 (WASM)         21.570         189896.28   185.45     1.21     
sha256-uint8array             23.286         175901.87   171.78     1.31     
fast-sha256                   27.405         149464.30   145.96     1.54     
@apeleghq/sha2 (ES)           34.700         118039.06   115.27     1.95     
@aws-crypto/sha256-js         42.605          96139.81    93.89     2.39     
js-sha256                     52.008          78756.57    76.91     2.92     
sha.js                        52.201          78466.52    76.63     2.93     
SubtleCrypto.digest           70.314          58252.77    56.89     3.95     
jssha                        102.638          39907.12    38.97     5.76     
================================================================================

Buffer Size: 8.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           92.174         44437.72    347.17     1.00      ⭐
hash-wasm                    115.905         35339.44    276.09     1.26     
@apeleghq/sha2 (WASM)        138.932         29481.99    230.33     1.51     
fast-sha256                  152.459         26866.25    209.89     1.65     
sha256-uint8array            168.342         24331.43    190.09     1.83     
@apeleghq/sha2 (ES)          234.541         17463.87    136.44     2.54     
@aws-crypto/sha256-js        247.764         16531.86    129.16     2.69     
sha.js                       376.521         10878.55     84.99     4.08     
js-sha256                    378.958         10808.59     84.44     4.11     
jssha                        657.468          6229.96     48.67     7.13     
================================================================================

Buffer Size: 64.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           213.336        19199.79    1199.99     1.00     ⭐
hash-wasm                     906.780         4517.08     282.32     4.25    
@apeleghq/sha2 (WASM)        1082.871         3782.54     236.41     5.08    
fast-sha256                  1158.839         3534.57     220.91     5.43    
sha256-uint8array            1331.819         3075.49     192.22     6.24    
@apeleghq/sha2 (ES)          1839.875         2226.24     139.14     8.62    
@aws-crypto/sha256-js        1919.013         2134.43     133.40     9.00    
sha.js                       2982.336         1373.42      85.84    13.98    
js-sha256                    2999.960         1365.35      85.33    14.06    
jssha                        5335.070          767.75      47.98    25.01    
================================================================================

Buffer Size: 128.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest            358.483       11425.94    1428.24     1.00     ⭐
hash-wasm                     1809.927        2263.07     282.88     5.05    
@apeleghq/sha2 (WASM)         2161.730        1894.78     236.85     6.03    
fast-sha256                   2307.237        1775.28     221.91     6.44    
sha256-uint8array             2662.413        1538.45     192.31     7.43    
@apeleghq/sha2 (ES)           3674.348        1114.76     139.34    10.25    
@aws-crypto/sha256-js         3875.821        1056.81     132.10    10.81    
sha.js                        5963.498         686.85      85.86    16.64    
js-sha256                     5997.562         682.94      85.37    16.73    
jssha                        10624.567         385.52      48.19    29.64    
================================================================================

Buffer Size: 1.00 MiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           2460.611       1664.63     1664.63     1.00     ⭐
hash-wasm                    14455.977        283.34      283.34     5.87    
@apeleghq/sha2 (WASM)        17273.645        237.12      237.12     7.02    
fast-sha256                  18400.186        222.61      222.61     7.48    
sha256-uint8array            21268.677        192.58      192.58     8.64    
@apeleghq/sha2 (ES)          29377.296        139.43      139.43    11.94    
@aws-crypto/sha256-js        30883.621        132.63      132.63    12.55    
sha.js                       47633.245         85.99       85.99    19.36    
js-sha256                    47922.980         85.47       85.47    19.48    
jssha                        88358.879         46.36       46.36    35.91    
================================================================================

Buffer Size: 8.00 MiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           19906.582      205.76      1646.09     1.00     ⭐
hash-wasm                    116755.581       35.08       280.65     5.87    
@apeleghq/sha2 (WASM)        138838.406       29.50       236.02     6.97    
fast-sha256                  147150.129       27.84       222.68     7.39    
sha256-uint8array            170153.840       24.07       192.58     8.55    
@apeleghq/sha2 (ES)          235558.740       17.39       139.11    11.83    
@aws-crypto/sha256-js        246980.488       16.58       132.67    12.41    
sha.js                       381080.391       10.75        85.99    19.14    
js-sha256                    383169.696       10.69        85.52    19.25    
jssha                        693626.187        5.91        47.24    34.84    
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
