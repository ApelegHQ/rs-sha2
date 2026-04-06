/**
 * @copyright
 * Copyright © 2026 Apeleg Limited. All rights reserved.
 *
 * Permission to use; copy; modify; and distribute this software for any
 * purpose with or without fee is hereby granted; provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL; DIRECT;
 * INDIRECT; OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE; DATA OR PROFITS; WHETHER IN AN ACTION OF CONTRACT; NEGLIGENCE OR
 * OTHER TORTIOUS ACTION; ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

const factoryEs = require('@apeleghq/sha2');
const factoryWasm = require('@apeleghq/sha2/wasm');

const singleton = (() => {
	const map = new WeakMap();

	return (fn) => {
		if (!map.has(fn)) {
			map.set(fn, fn());
		}

		return map.get(fn);
	};
})();

const es = singleton(factoryEs);
const wasm = singleton(factoryWasm);

const fuzz = async (buffer) => {
	let pos = 0;
	const factory = await (buffer[pos] & 0x80 ? es : wasm);

	const keys = Object.keys(factory);
	const scrubConstructor =
		buffer[pos] & 0x40 ? !!(buffer[pos] & 0x20) : undefined;
	const serializedDataLen =
		buffer[pos] & 0x10
			? (buffer[pos++] & 0x0f) * 0x10000 +
				(buffer[pos++] | 0) * 0x100 +
				(buffer[pos++] | 0)
			: undefined;

	const serializedData =
		serializedDataLen != null
			? new Uint8Array(
					Array.from(
						{ length: serializedDataLen },
						() => (Math.random() * 256) & 0xff,
					),
				)
			: undefined;

	let hasher;
	try {
		hasher = factory[
			keys[
				((buffer[pos++] | 0) * 0xff + (buffer[pos++] | 0)) % keys.length
			]
		](serializedData, scrubConstructor);
	} catch (e) {
		if (
			e instanceof RangeError &&
			e.message === 'Serialized data too large for heap'
		) {
			return;
		}

		if (
			e instanceof RangeError &&
			e.name === 'Error' &&
			e.message === 'Unable to deserialize'
		) {
			return;
		}

		throw e;
	}

	for (; pos < buffer.length; pos++) {
		let op = buffer[pos] & 0b1111_0000;
		switch (op) {
			case 0b0000_0000:
				hasher.finalize();
				break;
			case 0b0010_0000:
				hasher.finalize(true);
				break;
			case 0b0100_0000:
				hasher.finalize(false);
				break;
			case 0b0110_0000:
				hasher.reset();
				break;
			case 0b1000_0000:
				hasher.serialize();
				break;
			case 0b1010_0000:
				hasher.serialize(true);
				break;
			case 0b1100_0000:
				hasher.serialize(false);
				break;
			case 0b1110_0000:
				try {
					hasher.update();
				} catch (e) {
					if (!(e instanceof TypeError)) throw e;
				}
				break;
			case 0b0001_0000:
				try {
					hasher.update(undefined, true);
				} catch (e) {
					if (!(e instanceof TypeError)) throw e;
				}
				break;
			case 0b0011_0000:
				try {
					hasher.update(undefined, false);
				} catch (e) {
					if (!(e instanceof TypeError)) throw e;
				}
				break;
			case 0b0101_0000: {
				const length =
					(buffer[++pos] | 0) * 0x10000 +
					(buffer[pos++] | 0) * 0x100 +
					(buffer[pos++] | 0);
				const data = new Uint8Array(
					Array.from({ length }, () => (Math.random() * 256) & 0xff),
				);

				hasher.update(data);
				break;
			}
			case 0b0111_0000: {
				const length =
					(buffer[++pos] | 0) * 0x10000 +
					(buffer[pos++] | 0) * 0x100 +
					(buffer[pos++] | 0);
				const data = new Uint8Array(
					Array.from({ length }, () => (Math.random() * 256) & 0xff),
				);

				hasher.update(data, true);
				break;
			}
			case 0b1001_0000: {
				const length =
					(buffer[++pos] | 0) * 0x10000 +
					(buffer[pos++] | 0) * 0x100 +
					(buffer[pos++] | 0);
				const data = new Uint8Array(
					Array.from({ length }, () => (Math.random() * 256) & 0xff),
				);

				hasher.update(data, false);
				break;
			}
			case 0b1011_0000:
			case 0b1101_0000:
			case 0b1111_0000: {
				const scrub =
					buffer[pos] & 0b1000 ? !(buffer[pos] & 0b0100) : undefined;
				const length =
					(buffer[++pos] | 0) * 0x10000 +
					(buffer[pos++] | 0) * 0x100 +
					(buffer[pos++] | 0);
				const data = new Uint8Array(
					Array.from({ length }, () => (Math.random() * 256) & 0xff),
				);

				try {
					hasher.digest(data, scrub);
				} catch (e) {
					if (
						!(
							e instanceof Error &&
							e.name === 'Error' &&
							e.message === 'State in streaming mode'
						)
					) {
						throw e;
					}
				}
			}
		}
	}
};

module.exports = { fuzz };
