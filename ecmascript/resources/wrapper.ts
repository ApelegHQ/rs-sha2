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

/**
 * @file SHA-2 cryptographic hashing library backed by a WebAssembly instance.
 *
 * Provides streaming and one-shot digest operations for SHA-224, SHA-256,
 * SHA-384, SHA-512, and SHA-512/256. Hash state can optionally be serialized
 * and deserialized for persistence or transfer. A "scrub" option is available
 * on most operations to zero sensitive data from the WASM heap after use.
 *
 * Build-time feature flags (`import.meta.features.*`) control which hash
 * variants and capabilities (serialize / deserialize) are included in the
 * final bundle.
 *
 * @module sha2
 */

import instantiate from 'urn:uuid:2ba445c2-d903-4f19-abd0-c41d2cfd72f1';

/* eslint-disable no-var */
/* eslint no-restricted-syntax: ["error", "ArrowFunctionExpression", "ArrayPattern", "RestElement", "Class", "WithStatement", "VariableDeclaration[kind='const']", "VariableDeclaration[kind='let']", "BinaryExpression[operator='in']"] */

// ----------------------------------------------------------------
// Build-system type augmentations
// ----------------------------------------------------------------

declare global {
	/* eslint-disable @typescript-eslint/naming-convention */
	interface ImportMeta {
		readonly features: {
			readonly sha224: boolean;
			readonly sha256: boolean;
			readonly sha384: boolean;
			readonly sha512: boolean;
			readonly sha512_256: boolean;
			readonly serialize: boolean;
			readonly deserialize: boolean;
		};
	}

	var DEFAULT_EXPORT: unknown;
	/* eslint-enable @typescript-eslint/naming-convention */
}

// ----------------------------------------------------------------
// Exported types
// ----------------------------------------------------------------

type SerializeType = (scrub?: boolean) => ArrayBufferLike;

export type HashInstance = {
	/**
	 * Feeds data into the running hash. May be called multiple times.
	 */
	update: (
		data: ArrayBufferLike | ArrayBufferView,
		scrub?: boolean,
	) => HashInstance;
	/**
	 * Completes the hash computation and returns the digest.
	 */
	finalize: (scrub?: boolean) => ArrayBufferLike;
	/**
	 * Resets the hash back to its initial state (clears streaming mode).
	 */
	reset: () => HashInstance;
	/**
	 * One-shot convenience -- `update` + `finalize` + `reset` in a single
	 * call.  Throws if the instance is already in streaming mode.
	 */
	digest: (
		data: ArrayBufferLike | ArrayBufferView,
		scrub?: boolean,
	) => ArrayBufferLike;
};

export type SerializableHashInstance = HashInstance & {
	/**
	 * Serialises the current internal state so it can later be restored
	 * via the constructor.  Only present when the `serialize` feature flag
	 * is enabled.
	 */
	serialize: SerializeType;
};

/**
 * Creates a new hash instance.
 */
export type HashInstanceConstructor = () => HashInstance;

/**
 * Creates a new serialisable hash instance.
 */
export type SerializableHashInstanceConstructor =
	() => SerializableHashInstance;

/**
 * Creates a new hash instance resuming from previously serialised state.
 */
export type HashInstanceDeserializer = (
	serializedData: ArrayBufferLike | ArrayBufferView | null,
	scrub?: boolean,
) => HashInstance;

/**
 * Creates a new serialisable hash instance resuming from previously
 * serialised state.
 */
export type SerializableHashInstanceDeserializer = (
	serializedData: ArrayBufferLike | ArrayBufferView | null,
	scrub?: boolean,
) => SerializableHashInstance;

export type HashInstanceDeserializingConstructor = HashInstanceConstructor &
	HashInstanceDeserializer;

export type SerializableHashInstanceDeserializingConstructor =
	SerializableHashInstanceConstructor & SerializableHashInstanceDeserializer;

type HashInstanceConstructors =
	| HashInstanceConstructor
	| HashInstanceDeserializingConstructor
	| SerializableHashInstanceConstructor
	| SerializableHashInstanceDeserializingConstructor;

type Sha2ProtoFactories<T extends HashInstanceConstructors> = {
	/** Factory for SHA-224 instances. */
	['sha224']: T;
	/** Factory for SHA-256 instances. */
	['sha256']: T;
	/** Factory for SHA-384 instances. */
	['sha384']: T;
	/** Factory for SHA-512 instances. */
	['sha512']: T;
	/** Factory for SHA-512/256 instances. */
	['sha512_256']: T;
};

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

// ----------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------

/**
 * Aligns a byte offset **up** to the nearest 16-byte boundary.
 *
 * The operation adds 15 (`0xF`) and then clears the four least-significant
 * bits, which is equivalent to rounding up to the next multiple of 16.
 *
 * @param v - The byte offset or size to align.
 * @returns The smallest multiple of 16 that is >= `v`.
 *
 * @example
 * align128(0)  // => 0
 * align128(1)  // => 16
 * align128(16) // => 16
 * align128(17) // => 32
 */
function align128(v: number): number {
	return (v + 0xf) & ~0xf;
}

/**
 * Creates a minimal **enumerable** property descriptor whose `value` is `v`.
 *
 * The returned object is suitable for use with
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty Object.defineProperty}.
 * Because only `value` and `enumerable` are specified, the property will
 * default to non-writable and non-configurable.
 *
 * @param v - The value for the property descriptor.
 * @returns A property descriptor object.
 */
function wrap(v: unknown): PropertyDescriptor {
	return { value: v, enumerable: true };
}

/**
 * Defines (or redefines) an **enumerable, non-writable, non-configurable**
 * property on an object.
 *
 * This is a convenience wrapper around
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty Object.defineProperty}
 * that uses {@link wrap} to build the descriptor.
 *
 * @param o - The target object on which to define the property.
 * @param p - The property key.
 * @param v - The value to assign to the property.
 */
function set(o: object, p: string | symbol, v: unknown) {
	Object.defineProperty(o, p, wrap(v));
}

/**
 * Returns a shallow copy of a contiguous region of a `Uint8Array`.
 *
 * Equivalent to `b.slice(s, s + sz)`. The returned `Uint8Array` owns its
 * own backing `ArrayBuffer`.
 *
 * @param b  - The source byte array.
 * @param s  - The starting byte offset (inclusive).
 * @param sz - The number of bytes to copy.
 * @returns A new `Uint8Array` of length `sz` containing the copied bytes.
 */
function slice(b: Uint8Array, s: number, sz: number): Uint8Array {
	return b.slice(s, s + sz);
}

/**
 * Overwrites a region of a `Uint8Array` with zeroes ("scrubs" it).
 *
 * This is used to erase sensitive cryptographic state or input data from the
 * WebAssembly linear-memory heap after it is no longer needed.
 *
 * @param buffer - The byte array to scrub (typically the WASM heap).
 * @param offset - The starting byte offset within `buffer`.
 * @param size   - The number of bytes to zero out.
 */
function doScrub(buffer: Uint8Array, offset: number, size: number): void {
	var empty = new Uint8Array(size);
	buffer.set(empty, offset);
}

// ----------------------------------------------------------------
// Core factory
// ----------------------------------------------------------------

/**
 * Higher-order factory that produces a **hash-instance constructor** for a
 * single SHA-2 variant.
 *
 * The returned constructor, when called, allocates (or restores) internal
 * hash state on the WASM heap and returns an instance object exposing
 * `update`, `finalize`, `reset`, `digest`, and (optionally) `serialize`
 * methods.
 *
 * All WASM function pointers (`init`, `update`, etc.) are captured in the
 * closure so that the returned constructor is self-contained.
 *
 * @param heap
 *     A `Uint8Array` view over the WebAssembly linear memory buffer.
 * @param alignedHeapBase
 *     The 16-byte-aligned start of the usable heap region (beyond the WASM
 *     data section). Hash state will be placed here.
 * @param init
 *     WASM export -- initialises hash state at the given heap pointer and
 *     returns the state size in bytes.
 * @param update
 *     WASM export -- feeds data into the hash.  Receives `(statePtr,
 *     dataPtr, dataLength)`.
 * @param finalize
 *     WASM export -- finalises the hash. Receives `(statePtr, resultPtr)`
 *     and returns the digest size in bytes.
 * @param reset
 *     WASM export -- resets the hash state at the given pointer back to its
 *     initial value.
 * @param serialize
 *     WASM export -- serialises the current hash state. Receives
 *     `(statePtr, resultPtr)` and returns the serialised size in bytes.
 * @param deserialize
 *     WASM export -- deserialises previously-saved state. Receives
 *     `(serializedPtr, statePtr)` and returns the state size in bytes
 *     (0 on failure).
 *
 * @returns A constructor function that creates individual hash instances.
 */
function initFactory$(
	heap: Uint8Array,
	alignedHeapBase: number,
	init: WasmInit,
	update: WasmUpdate,
	finalize: WasmFinalize,
	reset: WasmReset,
	serialize: WasmSerialize,
	deserialize: WasmDeserialize,
): HashInstanceConstructors {
	/**
	 * Constructs a hash instance, optionally restoring from serialised data.
	 *
	 * @param serializedData
	 *     Previously serialised hash state to restore.  Pass `null` or
	 *     `undefined` for a fresh instance.
	 * @param scrub
	 *     If `true`, sensitive data written to the WASM heap during
	 *     initialisation / deserialisation is zeroed afterwards.
	 * @returns The hash instance object.
	 */
	return function (
		serializedData?: ArrayBufferLike | ArrayBufferView | null,
		scrub?: boolean,
	): HashInstance {
		/**
		 * Internal copy of the hash algorithm's opaque state.
		 *
		 * This `Uint8Array` is kept in JavaScript memory and copied to/from
		 * the WASM heap each time a WASM function needs to run (see
		 * `callFactory`). This avoids one instance's state being clobbered
		 * by another instance that shares the same heap.
		 */
		var s: Uint8Array = (function (): Uint8Array {
			if (import.meta.features.deserialize && serializedData) {
				// --- Deserialisation path ---
				// Place the serialised blob at the *end* of the heap so it
				// does not overlap with the state region at alignedHeapBase.
				var statePtr = heap.byteLength - serializedData.byteLength;

				var requiredSize = init(0);
				// The output state is written at:
				//   [alignedHeapBase, alignedHeapBase + N)
				// Ensure the input region [statePtr, requiredSize) cannot
				// overlap.
				if (statePtr < alignedHeapBase + requiredSize) {
					throw new RangeError('Serialized data too large for heap');
				}

				var serializedDataU8: Uint8Array;
				// Normalise the input to a plain Uint8Array so we can
				// call heap.set() with it.
				if (!ArrayBuffer.isView(serializedData)) {
					serializedDataU8 = new Uint8Array(serializedData);
				} else if (!(serializedData instanceof Uint8Array)) {
					serializedDataU8 = new Uint8Array(
						serializedData.buffer,
						serializedData.byteOffset,
						serializedData.byteLength,
					);
				} else {
					serializedDataU8 = serializedData;
				}

				heap.set(serializedDataU8, statePtr);
				try {
					/** Byte-size of the restored state (0 = failure). */
					var size = deserialize(statePtr, alignedHeapBase);

					if (!size) {
						throw new Error('Unable to deserialize');
					}

					var s = slice(heap, alignedHeapBase, size);

					if (scrub) {
						doScrub(heap, alignedHeapBase, size);
					}

					return s;
				} finally {
					if (scrub) {
						doScrub(heap, statePtr, serializedData.byteLength);
					}
				}
			} else {
				// --- Fresh initialisation path ---
				var size = init(alignedHeapBase);
				var s = slice(heap, alignedHeapBase, size);

				return s;
			}
		})();

		/** Cached byte-length of the opaque hash state. */
		var sSize = s.byteLength;

		/**
		 * Tracks whether any data has been fed into this instance via
		 * `update` or `finalize`. Used by `digest` to guard against
		 * misuse (calling `digest` while already streaming).
		 *
		 * Initialised to `true` when the instance was created from
		 * serialised (i.e., in-progress) data, `false` otherwise.
		 */
		var streaming = !!serializedData;

		/**
		 * The public hash-instance object.  Properties are added via
		 * {@link set} to make them enumerable but non-writable /
		 * non-configurable.
		 */
		var instance: HashInstance = Object.create(null);

		/**
		 * Copies the local state snapshot onto the WASM heap, invokes a
		 * callback that may call one or more WASM exports, then copies the
		 * (possibly mutated) state back into the local snapshot.
		 *
		 * This "check-out / check-in" pattern allows multiple independent
		 * hash instances to share a single WebAssembly linear memory
		 * without interfering with each other.
		 *
		 * @param cb
		 *     A callback that performs work on the WASM heap while the
		 *     state is checked out.  Its return value is forwarded to the
		 *     caller.
		 * @param scrub
		 *     If `true`, the state region on the WASM heap is zeroed after
		 *     the state has been copied back.
		 * @returns Whatever `cb` returned.
		 */
		function callFactory<T>(cb: () => T, scrub?: boolean): T {
			// Copy local state -> WASM heap.
			heap.set(s, alignedHeapBase);
			try {
				var r = cb();
				// Copy (potentially mutated) state back from WASM heap � local.
				s.set(heap.subarray(alignedHeapBase, alignedHeapBase + sSize));

				return r;
			} finally {
				if (scrub) {
					doScrub(heap, alignedHeapBase, sSize);
				}
			}
		}

		/**
		 * Feeds arbitrary data into the hash, updating the internal state.
		 *
		 * If the supplied data is larger than the available heap space
		 * between the end of the state region and the end of heap, it is
		 * automatically processed in chunks so that the WASM heap is never
		 * overflowed.
		 *
		 * After this call the instance is considered to be in **streaming
		 * mode**, which means {@link digest$} will throw until
		 * {@link reset$} is called.
		 *
		 * @param data
		 *     The data to hash.  `ArrayBuffer` and other typed-array views
		 *     are automatically normalised to `Uint8Array`.
		 * @param scrub
		 *     If `true`, both the data region and the state region on the
		 *     WASM heap are zeroed after the operation completes.
		 */
		var update$ = function update$(
			data: ArrayBufferLike | ArrayBufferView,
			scrub?: boolean,
		): HashInstance {
			return callFactory(function () {
				streaming = true;

				/** 16-byte-aligned offset where input data is staged. */
				var data_ptr = align128(alignedHeapBase + sSize);

				/** Total heap size -- used as the upper bound. */
				var data_max = heap.byteLength;

				/**
				 * Maximum number of input bytes that fit between `data_ptr`
				 * and the end of the heap.  Data larger than this is
				 * processed in multiple iterations.
				 */
				var diff = data_max - data_ptr;

				// Normalise data to a plain Uint8Array.
				var dataU8: Uint8Array;
				if (!ArrayBuffer.isView(data)) {
					dataU8 = new Uint8Array(data);
				} else if (!(data instanceof Uint8Array)) {
					dataU8 = new Uint8Array(
						data.buffer,
						data.byteOffset,
						data.byteLength,
					);
				} else {
					dataU8 = data;
				}

				// Process data in chunks of at most `diff` bytes.
				for (var i = 0; i < dataU8.byteLength; i += diff) {
					var subarray = dataU8.subarray(i, i + diff);
					heap.set(subarray, data_ptr);
					update(alignedHeapBase, data_ptr, subarray.byteLength);
				}
				if (scrub) {
					doScrub(
						heap,
						data_ptr,
						data.byteLength > diff ? diff : data.byteLength,
					);
				}

				return instance;
			}, scrub);
		} satisfies HashInstance['update'];
		set(instance, 'update', update$);

		/**
		 * Finalises the hash computation and returns the resulting digest.
		 *
		 * The internal state is **not** automatically reset -- call
		 * {@link reset$} afterwards if you wish to reuse the instance.
		 *
		 * @param scrub
		 *     If `true`, the digest bytes and the state region on the WASM
		 *     heap are zeroed after the result has been copied out.
		 * @returns The raw hash digest.
		 */
		var finalize$ = function finalize$(scrub?: boolean): ArrayBufferLike {
			return callFactory(function () {
				streaming = true;

				/** 16-byte-aligned offset where the digest is written. */
				var result_ptr = align128(alignedHeapBase + sSize);

				/** Digest size in bytes as reported by the WASM export. */
				var size = finalize(alignedHeapBase, result_ptr);

				/** A copy of the digest bytes. */
				var r = slice(heap, result_ptr, size);

				if (scrub) {
					doScrub(heap, result_ptr, size);
				}

				return r.buffer;
			}, scrub);
		} satisfies HashInstance['finalize'];
		set(instance, 'finalize', finalize$);

		/**
		 * Resets the hash back to its initial state, clearing streaming
		 * mode.
		 *
		 * After a reset the instance can be reused for a completely new
		 * hash computation (including via {@link digest$}).
		 */
		var reset$ = function reset$(): HashInstance {
			return callFactory(function () {
				streaming = false;
				reset(alignedHeapBase);
			}, false);
		} satisfies HashInstance['reset'];
		set(instance, 'reset', reset$);

		/**
		 * One-shot convenience method: hashes `data` in a single call and
		 * returns the digest.
		 *
		 * Internally this performs `update(data) � finalize() � reset()`.
		 *
		 * **Throws** if the instance is already in streaming mode (i.e.,
		 * `update` or `finalize` has been called without a subsequent
		 * `reset`).
		 *
		 * @param data - The complete message to hash.
		 * @param scrub
		 *     If `true`, intermediate data on the WASM heap is zeroed
		 *     after each sub-operation.
		 * @returns The raw hash digest.
		 * @throws If the instance is currently in streaming mode.
		 */
		var digest$ = function digest$(
			data: ArrayBufferLike | ArrayBufferView,
			scrub?: boolean,
		): ArrayBufferLike {
			if (streaming) {
				throw new Error('State in streaming mode');
			}

			update$(data, scrub);
			// Not scrubbing on purpose, since `reset$` implies scrubbing
			var r = finalize$(false);
			reset$();

			return r;
		} satisfies HashInstance['digest'];
		set(instance, 'digest', digest$);

		/**
		 * Serialises the current internal hash state into an `ArrayBuffer`
		 * that can later be passed to the hash-instance constructor to
		 * resume computation.
		 *
		 * Only available when the `serialize` build-time feature flag is
		 * enabled (`import.meta.features.serialize`).
		 *
		 * @param scrub
		 *     If `true`, the serialised bytes and the state region on the
		 *     WASM heap are zeroed after the result has been copied out.
		 * @returns An opaque blob representing the hash state.
		 */
		var serialize$ = function serialize$(scrub?: boolean): ArrayBufferLike {
			return callFactory(function () {
				/** 16-byte-aligned offset where serialised output is written. */
				var result_ptr = align128(alignedHeapBase + sSize);

				/** Serialised size in bytes. */
				var size = serialize(alignedHeapBase, result_ptr);

				/** A copy of the serialised bytes. */
				var r = slice(heap, result_ptr, size);

				if (scrub) {
					doScrub(heap, result_ptr, size);
				}

				return r.buffer;
			}, scrub);
		} satisfies SerializableHashInstance['serialize'];
		if (import.meta.features.serialize) {
			set(instance, 'serialize', serialize$);
		}

		return instance;
	} as HashInstanceConstructors;
}

type SerializerDeserializerDiscriminator<T> = 'serialize' extends T
	? 'deserialize' extends T
		? SerializableHashInstanceDeserializingConstructor
		: SerializableHashInstanceConstructor
	: 'deserialize' extends T
		? HashInstanceDeserializingConstructor
		: HashInstanceConstructor;

export type Sha2Factories<TFeat extends string = never> = Pick<
	Sha2ProtoFactories<SerializerDeserializerDiscriminator<TFeat>>,
	Extract<
		TFeat,
		keyof Sha2ProtoFactories<SerializerDeserializerDiscriminator<TFeat>>
	>
>;

// ----------------------------------------------------------------
// Return type for sha2()
// ----------------------------------------------------------------

type Sha2Result = Sha2Factories<string>;

// ----------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------

/**
 * Entry-point that instantiates the underlying WebAssembly module, sets up
 * the shared heap, and returns an object whose properties are
 * hash-instance constructor functions -- one per enabled SHA-2 variant.
 *
 * Which variants are included is controlled by the build-time feature flags
 * on `import.meta.features` (`sha224`, `sha256`, `sha384`, `sha512`,
 * `sha512_256`).
 *
 * @returns An object mapping algorithm names to their respective factory /
 *     constructor functions.
 *
 * @example
 * const factories = await sha2();
 * const hasher    = factories.sha256();       // fresh instance
 * const digest    = hasher.digest(myData);    // one-shot
 *
 * @example
 * const factories = await sha2();
 * const hasher    = factories.sha512();
 * hasher.update(chunk1);
 * hasher.update(chunk2);
 * const digest = hasher.finalize();
 */
function sha2(): Promise<Sha2Result> {
	/** The raw WASM instance obtained from the embedded module. */
	return instantiate({}).then(function (instance: IWasmInstance) {
		var exports = instance.exports;
		/**
		 * A `Uint8Array` view over the entire WebAssembly linear memory.
		 * All WASM function calls read from / write to this buffer.
		 */
		var heap = new Uint8Array(exports.memory.buffer);

		/**
		 * The first byte of the WASM heap that is not occupied by the data
		 * section (as reported by the `__heap_base` global export).
		 */
		var heapBase: number =
			typeof exports.__heap_base === 'object'
				? exports.__heap_base.value
				: /* Compatibility with old binaryen / wasm2js */
					exports.__heap_base;

		if (
			typeof heapBase !== 'number' ||
			!Number.isSafeInteger(heapBase) ||
			heapBase < 0
		) {
			throw new TypeError('Unable to determine the heap base');
		}

		/**
		 * `heapBase` rounded up to the nearest 16-byte boundary. All
		 * dynamic allocations start here.
		 */
		var alignedHeapBase = align128(heapBase);

		/** The returned object mapping algorithm names � factory functions. */
		var result: Sha2Result = Object.create(null);

		if (import.meta.features.sha224) {
			set(
				result,
				'sha224',
				initFactory$(
					heap,
					alignedHeapBase,
					exports.sha224_init,
					exports.sha224_update,
					exports.sha224_finalize,
					exports.sha224_reset,
					exports.sha224_serialize,
					exports.sha224_deserialize,
				),
			);
		}

		if (import.meta.features.sha256) {
			set(
				result,
				'sha256',
				initFactory$(
					heap,
					alignedHeapBase,
					exports.sha256_init,
					exports.sha256_update,
					exports.sha256_finalize,
					exports.sha256_reset,
					exports.sha256_serialize,
					exports.sha256_deserialize,
				),
			);
		}

		if (import.meta.features.sha384) {
			set(
				result,
				'sha384',
				initFactory$(
					heap,
					alignedHeapBase,
					exports.sha384_init,
					exports.sha384_update,
					exports.sha384_finalize,
					exports.sha384_reset,
					exports.sha384_serialize,
					exports.sha384_deserialize,
				),
			);
		}

		if (import.meta.features.sha512) {
			set(
				result,
				'sha512',
				initFactory$(
					heap,
					alignedHeapBase,
					exports.sha512_init,
					exports.sha512_update,
					exports.sha512_finalize,
					exports.sha512_reset,
					exports.sha512_serialize,
					exports.sha512_deserialize,
				),
			);
		}

		if (import.meta.features.sha512_256) {
			set(
				result,
				'sha512_256',
				initFactory$(
					heap,
					alignedHeapBase,
					exports.sha512_256_init,
					exports.sha512_256_update,
					exports.sha512_256_finalize,
					exports.sha512_256_reset,
					exports.sha512_256_serialize,
					exports.sha512_256_deserialize,
				),
			);
		}

		return result;
	});
}

/**
 * The module's default export.
 *
 * Calling `sha2()` returns a {@link Sha2Result} object from which
 * individual hash instances can be constructed.
 */
DEFAULT_EXPORT = sha2;
