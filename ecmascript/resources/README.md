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
hash-wasm                     17.908         228729.36   223.37     1.00      ⭐
@apeleghq/sha2 (WASM)         18.554         220760.33   215.59     1.04
sha256-uint8array             23.489         174376.02   170.29     1.31
@apeleghq/sha2 (ES)           24.279         168708.42   164.75     1.36
fast-sha256                   27.281         150140.85   146.62     1.52
@aws-crypto/sha256-js         41.425          98877.56    96.56     2.31
js-sha256                     51.750          79149.86    77.29     2.89
sha.js                        52.429          78124.11    76.29     2.93
SubtleCrypto.digest           68.650          59664.78    58.27     3.83
jssha                        102.202          40077.33    39.14     5.71
================================================================================

Buffer Size: 8.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           93.867         43636.01    340.91     1.00      ⭐
hash-wasm                    115.955         35324.13    275.97     1.24
@apeleghq/sha2 (WASM)        116.248         35235.13    275.27     1.24
fast-sha256                  152.627         26836.72    209.66     1.63
@apeleghq/sha2 (ES)          156.886         26108.06    203.97     1.67
sha256-uint8array            168.359         24329.02    190.07     1.79
@aws-crypto/sha256-js        247.438         16553.63    129.33     2.64
sha.js                       376.524         10878.45     84.99     4.01
js-sha256                    378.580         10819.37     84.53     4.03
jssha                        660.090          6205.21     48.48     7.03
================================================================================

Buffer Size: 64.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           212.170        19305.28    1206.58     1.00     ⭐
@apeleghq/sha2 (WASM)         901.276         4544.67     284.04     4.25
hash-wasm                     905.968         4521.13     282.57     4.27
fast-sha256                  1157.976         3537.21     221.08     5.46
@apeleghq/sha2 (ES)          1226.223         3340.34     208.77     5.78
sha256-uint8array            1330.741         3077.98     192.37     6.27
@aws-crypto/sha256-js        1980.469         2068.20     129.26     9.33
sha.js                       2980.724         1374.16      85.89    14.05
js-sha256                    2996.600         1366.88      85.43    14.12
jssha                        5388.595          760.12      47.51    25.40
================================================================================

Buffer Size: 128.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest            360.529       11361.09    1420.14     1.00     ⭐
@apeleghq/sha2 (WASM)         1797.741        2278.41     284.80     4.99
hash-wasm                     1807.536        2266.07     283.26     5.01
fast-sha256                   2305.363        1776.73     222.09     6.39
@apeleghq/sha2 (ES)           2448.420        1672.92     209.11     6.79
sha256-uint8array             2659.097        1540.37     192.55     7.38
@aws-crypto/sha256-js         4161.318         984.30     123.04    11.54
sha.js                        5955.823         687.73      85.97    16.52
js-sha256                     5987.711         684.07      85.51    16.61
jssha                        10764.751         380.50      47.56    29.86
================================================================================

Buffer Size: 1.00 MiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           2468.077       1659.59     1659.59     1.00     ⭐
@apeleghq/sha2 (WASM)        14416.966        284.11      284.11     5.84
hash-wasm                    14451.001        283.44      283.44     5.86
fast-sha256                  18393.159        222.69      222.69     7.45
@apeleghq/sha2 (ES)          19469.683        210.38      210.38     7.89
sha256-uint8array            21249.260        192.76      192.76     8.61
@aws-crypto/sha256-js        31072.920        131.82      131.82    12.59
sha.js                       47615.884         86.02       86.02    19.29
js-sha256                    47862.783         85.58       85.58    19.39
jssha                        90428.630         45.30       45.30    36.64
================================================================================

Buffer Size: 8.00 MiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           19974.241      205.06      1640.51     1.00     ⭐
@apeleghq/sha2 (WASM)        115762.622       35.38       283.06     5.80
hash-wasm                    116907.237       35.04       280.29     5.85
fast-sha256                  147067.070       27.85       222.81     7.36
@apeleghq/sha2 (ES)          156060.900       26.25       209.97     7.81
sha256-uint8array            170020.746       24.09       192.73     8.51
@aws-crypto/sha256-js        244949.161       16.72       133.77    12.26
js-sha256                    380755.225       10.76        86.06    19.06
sha.js                       380795.996       10.76        86.05    19.06
jssha                        691979.868        5.92        47.35    34.64
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
