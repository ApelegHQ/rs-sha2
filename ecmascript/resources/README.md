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
hash-wasm                     17.753         230719.25   225.31     1.00      ⭐
@apeleghq/sha2 (WASM)         20.588         198949.70   194.29     1.16
sha256-uint8array             23.341         175483.48   171.37     1.31
fast-sha256                   27.349         149768.12   146.26     1.54
@apeleghq/sha2 (ES)           33.844         121026.92   118.19     1.91
@aws-crypto/sha256-js         42.635          96070.89    93.82     2.40
sha.js                        51.790          79087.98    77.23     2.92
js-sha256                     52.268          78365.01    76.53     2.94
SubtleCrypto.digest           68.663          59653.84    58.26     3.87
jssha                        102.478          39969.55    39.03     5.77
================================================================================

Buffer Size: 8.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           96.141         42603.93    332.84     1.00      ⭐
hash-wasm                    115.893         35342.83    276.12     1.21
@apeleghq/sha2 (WASM)        124.304         32951.59    257.43     1.29
fast-sha256                  152.721         26820.07    209.53     1.59
sha256-uint8array            168.277         24340.83    190.16     1.75
@apeleghq/sha2 (ES)          226.813         18058.93    141.09     2.36
@aws-crypto/sha256-js        248.146         16506.41    128.96     2.58
sha.js                       376.289         10885.26     85.04     3.91
js-sha256                    378.601         10818.77     84.52     3.94
jssha                        657.563          6229.06     48.66     6.84
================================================================================

Buffer Size: 64.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           211.157        19397.90    1212.37     1.00     ⭐
hash-wasm                     906.215         4519.90     282.49     4.29
@apeleghq/sha2 (WASM)         966.743         4236.91     264.81     4.58
fast-sha256                  1158.363         3536.02     221.00     5.49
sha256-uint8array            1331.600         3076.00     192.25     6.31
@apeleghq/sha2 (ES)          1779.562         2301.69     143.86     8.43
@aws-crypto/sha256-js        1923.719         2129.21     133.08     9.11
sha.js                       2978.650         1375.12      85.94    14.11
js-sha256                    2996.032         1367.14      85.45    14.19
jssha                        5391.971          759.65      47.48    25.54
================================================================================

Buffer Size: 128.00 KiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest            359.274       11400.77    1425.10     1.00     ⭐
hash-wasm                     1808.039        2265.44     283.18     5.03
@apeleghq/sha2 (WASM)         1929.769        2122.53     265.32     5.37
fast-sha256                   2306.780        1775.64     221.95     6.42
sha256-uint8array             2660.531        1539.54     192.44     7.41
@apeleghq/sha2 (ES)           3546.149        1155.06     144.38     9.87
@aws-crypto/sha256-js         3889.897        1052.98     131.62    10.83
sha.js                        5951.984         688.17      86.02    16.57
js-sha256                     5987.387         684.10      85.51    16.67
jssha                        10723.736         381.96      47.74    29.85
================================================================================

Buffer Size: 1.00 MiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           2458.762       1665.88     1665.88     1.00     ⭐
hash-wasm                    14453.914        283.38      283.38     5.88
@apeleghq/sha2 (WASM)        15421.658        265.60      265.60     6.27
fast-sha256                  18399.600        222.61      222.61     7.48
sha256-uint8array            21265.097        192.62      192.62     8.65
@apeleghq/sha2 (ES)          28366.398        144.40      144.40    11.54
@aws-crypto/sha256-js        30942.575        132.37      132.37    12.58
sha.js                       47629.494         86.00       86.00    19.37
js-sha256                    47870.311         85.56       85.56    19.47
jssha                        89912.620         45.56       45.56    36.57
================================================================================

Buffer Size: 8.00 MiB | Iterations: 4096
--------------------------------------------------------------------------------
Package                     Time (ms)       Ops/s       MiB/s      Relative
--------------------------------------------------------------------------------
SubtleCrypto.digest           19917.685      205.65      1645.17     1.00     ⭐
hash-wasm                    116757.365       35.08       280.65     5.86
@apeleghq/sha2 (WASM)        124076.017       33.01       264.10     6.23
fast-sha256                  147128.769       27.84       222.72     7.39
sha256-uint8array            170127.878       24.08       192.61     8.54
@apeleghq/sha2 (ES)          227447.728       18.01       144.07    11.42
@aws-crypto/sha256-js        246919.825       16.59       132.71    12.40
sha.js                       380766.733       10.76        86.06    19.12
js-sha256                    382639.567       10.70        85.64    19.21
jssha                        689309.321        5.94        47.54    34.61
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
