/* Copyright © 2026 Apeleg Limited. All rights reserved.
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

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { describe, test } from 'node:test';
import getSha2Instance from './get-sha2-instance.js';
import { hexToBytes } from './helpers.js';

const sha2 = await getSha2Instance();

// ---------------------------------------------------------------------------
describe('API shape', () => {
	test('factory exposes sha256 and sha384', () => {
		assert.equal(typeof sha2.sha256, 'function');
		assert.equal(typeof sha2.sha384, 'function');
	});

	test('hash instance has update, finalize, reset, digest', () => {
		const h = sha2.sha256();
		for (const m of ['update', 'finalize', 'reset', 'digest'] as const) {
			assert.equal(typeof h[m], 'function', `expected method ${m}`);
		}
	});

	test('most-featured variant exposes serialize on instances', () => {
		assert.equal(typeof sha2.sha256().serialize, 'function');
	});
});

// ---------------------------------------------------------------------------
describe('reset behaviour', () => {
	// NIST vector: SHA-256(0xd3) = 28969cdf…
	const msg = hexToBytes('d3');
	const expected = hexToBytes(
		'28969cdfa74a12c82f3bad960b0b000aca2ac329deea5c2328ebc6f2ba9802c1',
	);

	test('digest can be called repeatedly (implicit reset)', () => {
		const h = sha2.sha256();
		const d1 = h.digest(msg, false);
		const d2 = h.digest(msg, true);
		assert.deepStrictEqual(Buffer.from(d1), Buffer.from(expected));
		assert.deepStrictEqual(Buffer.from(d2), Buffer.from(expected));
	});

	test('explicit reset after streaming allows a fresh digest', () => {
		const h = sha2.sha256();
		h.update(hexToBytes('aabbccdd')); // garbage
		h.reset();
		const digest = h.digest(msg);
		assert.deepStrictEqual(Buffer.from(digest), Buffer.from(expected));
	});
});

// ---------------------------------------------------------------------------
describe('empty message', () => {
	// SHA-256("") = e3b0c442…
	const expected = hexToBytes(
		'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
	);

	test('one-shot digest of zero-length Uint8Array', () => {
		const digest = sha2.sha256().digest(new Uint8Array(0));
		assert.deepStrictEqual(Buffer.from(digest), Buffer.from(expected));
	});

	test('finalize without any prior update', () => {
		const digest = sha2.sha256().finalize();
		assert.deepStrictEqual(Buffer.from(digest), Buffer.from(expected));
	});
});

// ---------------------------------------------------------------------------
// These tests dynamically import sub-path variants, verifying that
// package.json `exports` map entries resolve correctly.
describe('sub-path imports', () => {
	test('sha256+streaming has sha256 but not sha384', async () => {
		const fac = await getSha2Instance('sha256+streaming');
		assert.equal(typeof fac.sha256, 'function');
		assert.equal(fac.sha384, undefined);
	});

	test('sha384+streaming has sha384 but not sha256', async () => {
		const fac = await getSha2Instance('sha384+streaming');
		assert.equal(typeof fac.sha384, 'function');
		assert.equal(fac.sha256, undefined);
	});

	test('sha256+sha384+streaming has both algorithms', async () => {
		const fac = await getSha2Instance('sha256+sha384+streaming');
		assert.equal(typeof fac.sha256, 'function');
		assert.equal(typeof fac.sha384, 'function');
	});

	test('non-serialize variant does not expose serialize()', async () => {
		const fac = await getSha2Instance('sha256+streaming');
		const h = fac.sha256();
		assert.equal(typeof h.serialize, 'undefined');
	});

	test('sub-path variant produces the correct digest', async () => {
		const fac = await getSha2Instance('sha256+streaming');
		const digest = fac.sha256().digest(hexToBytes('d3'));
		assert.deepStrictEqual(
			Buffer.from(digest),
			Buffer.from(
				hexToBytes(
					'28969cdfa74a12c82f3bad960b0b000aca2ac329deea5c2328ebc6f2ba9802c1',
				),
			),
		);
	});
});
