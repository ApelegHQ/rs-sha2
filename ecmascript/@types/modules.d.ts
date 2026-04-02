/**
 * @copyright
 * Copyright © 2026 Apeleg Limited. All rights reserved.
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

// ----------------------------------------------------------------
// WASM function type aliases
// ----------------------------------------------------------------

type WasmInit = (ptr: number) => number;
type WasmUpdate = (statePtr: number, dataPtr: number, dataLen: number) => void;
type WasmFinalize = (statePtr: number, resultPtr: number) => number;
type WasmReset = (ptr: number) => void;
type WasmSerialize = (statePtr: number, resultPtr: number) => number;
type WasmDeserialize = (serializedPtr: number, statePtr: number) => number;

/* eslint-disable @typescript-eslint/naming-convention */
interface IWasmInstance extends WebAssembly.Instance {
	exports: {
		memory: WebAssembly.Memory;
		__heap_base: WebAssembly.Global;
		sha224_init: WasmInit;
		sha224_update: WasmUpdate;
		sha224_finalize: WasmFinalize;
		sha224_reset: WasmReset;
		sha224_serialize: WasmSerialize;
		sha224_deserialize: WasmDeserialize;
		sha256_init: WasmInit;
		sha256_update: WasmUpdate;
		sha256_finalize: WasmFinalize;
		sha256_reset: WasmReset;
		sha256_serialize: WasmSerialize;
		sha256_deserialize: WasmDeserialize;
		sha384_init: WasmInit;
		sha384_update: WasmUpdate;
		sha384_finalize: WasmFinalize;
		sha384_reset: WasmReset;
		sha384_serialize: WasmSerialize;
		sha384_deserialize: WasmDeserialize;
		sha512_init: WasmInit;
		sha512_update: WasmUpdate;
		sha512_finalize: WasmFinalize;
		sha512_reset: WasmReset;
		sha512_serialize: WasmSerialize;
		sha512_deserialize: WasmDeserialize;
		sha512_256_init: WasmInit;
		sha512_256_update: WasmUpdate;
		sha512_256_finalize: WasmFinalize;
		sha512_256_reset: WasmReset;
		sha512_256_serialize: WasmSerialize;
		sha512_256_deserialize: WasmDeserialize;
	};
}
/* eslint-enable @typescript-eslint/naming-convention */

declare module 'urn:uuid:2ba445c2-d903-4f19-abd0-c41d2cfd72f1' {
	const instantiate: (
		externals: Record<string, unknown>,
	) => Promise<IWasmInstance>;

	export default instantiate;
}

declare module 'urn:uuid:0a426584-7134-49f9-ad16-bae3759aeb1c' {
	const base64Text: string;

	export { base64Text };
}
