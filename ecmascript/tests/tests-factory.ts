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
import { type ITestVector } from './parse-vectors.js';

const testsFactory = (
	family: string,
	getInstance: () => ReturnType<typeof eval>,
	desc: string,
	vectorsCallback: () => Promise<ITestVector[]>,
	skip?: boolean,
) => {
	describe(`[${family}] ${desc}`, { skip }, async () => {
		const vectors = await vectorsCallback();

		// ---------------------------------------------------------------------------
		describe('One-shot digest', () => {
			for (const v of vectors) {
				test(`Len = ${v.len}`, () => {
					const digest = getInstance().digest(v.msg);
					assert.deepStrictEqual(
						Buffer.from(digest),
						Buffer.from(v.md),
					);
				});
			}
		});

		// ---------------------------------------------------------------------------
		describe('Streaming: single update + finalize', () => {
			for (const v of vectors) {
				test(`Len = ${v.len}`, () => {
					const h = getInstance();
					h.update(v.msg);
					assert.deepStrictEqual(
						Buffer.from(h.finalize()),
						Buffer.from(v.md),
					);
				});
			}
		});

		// ---------------------------------------------------------------------------
		describe('Streaming: byte-by-byte', () => {
			for (const v of vectors.filter((v) => v.len > 0 && v.len <= 128)) {
				test(`Len = ${v.len}`, () => {
					const h = getInstance();
					for (let i = 0; i < v.msg.length; i++) {
						h.update(v.msg.subarray(i, i + 1));
					}
					assert.deepStrictEqual(
						Buffer.from(h.finalize()),
						Buffer.from(v.md),
					);
				});
			}
		});

		// ---------------------------------------------------------------------------
		describe('Streaming: three uneven chunks', () => {
			for (const v of vectors.filter((v) => v.len >= 24)) {
				test(`Len = ${v.len}`, () => {
					const h = getInstance();
					const t1 = Math.floor(v.msg.length / 3);
					const t2 = Math.floor((2 * v.msg.length) / 3);
					h.update(v.msg.subarray(0, t1));
					h.update(v.msg.subarray(t1, t2));
					h.update(v.msg.subarray(t2));
					assert.deepStrictEqual(
						Buffer.from(h.finalize()),
						Buffer.from(v.md),
					);
				});
			}
		});
	});
};

export default testsFactory;
