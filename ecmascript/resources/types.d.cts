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
type SerializeType = (scrub?: boolean) => ArrayBufferLike;
export type HashInstance = {
	/**
	 * Feeds data into the running hash. May be called multiple times.
	 */
	update: (data: ArrayBufferLike | ArrayBufferView, scrub?: boolean) => void;
	/**
	 * Completes the hash computation and returns the digest.
	 */
	finalize: (scrub?: boolean) => ArrayBufferLike;
	/**
	 * Resets the hash back to its initial state (clears streaming mode).
	 */
	reset: () => void;
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
