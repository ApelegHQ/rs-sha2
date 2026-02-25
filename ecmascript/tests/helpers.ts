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

/** Convert a hex string to a Uint8Array. */
export function hexToBytes(hex: string): Uint8Array {
	const len = hex.length / 2;
	const out = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
	}
	return out;
}

/** Convert an ArrayBuffer or typed array to a lower-case hex string. */
export function toHex(data: ArrayBuffer | Uint8Array): string {
	const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}
