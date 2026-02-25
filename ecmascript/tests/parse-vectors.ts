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

import { hexToBytes } from './helpers.js';

export interface ITestVector {
	/** Message length in bits. */
	len: number;
	/** Raw message bytes (empty when len = 0). */
	msg: Uint8Array;
	/** Expected message digest. */
	md: Uint8Array;
}

export interface IVectorFile {
	/** Digest output length in bytes (from the `[L = N]` header). */
	digestLength: number;
	vectors: ITestVector[];
}

/**
 * Parse a NIST CAVS `.rsp` response file.
 *
 * Expected format (comments, blank-line–separated records):
 *
 * ```
 * # comment
 * [L = 32]
 *
 * Len = 0
 * Msg = 00
 * MD  = e3b0c44298fc…
 * ```
 */
export function parseVectorFile(content: string): IVectorFile {
	let digestLength = 0;
	const vectors: ITestVector[] = [];

	let curLen: number | undefined;
	let curMsg: string | undefined;
	let curMd: string | undefined;

	function flush(): void {
		if (
			curLen !== undefined &&
			curMsg !== undefined &&
			curMd !== undefined
		) {
			// When Len = 0 the Msg field is a placeholder — use an empty buffer.
			const msg =
				curLen === 0
					? new Uint8Array(0)
					: hexToBytes(curMsg.slice(0, (curLen / 8) * 2));

			vectors.push({ len: curLen, msg, md: hexToBytes(curMd) });
		}
		curLen = curMsg = curMd = undefined;
	}

	for (const raw of content.split('\n')) {
		const line = raw.trim();

		if (line === '' || line.startsWith('#')) {
			flush();
			continue;
		}

		const header = line.match(/^\[\s*L\s*=\s*(\d+)\s*\]$/);
		if (header) {
			digestLength = parseInt(header[1], 10);
			continue;
		}

		const kv = line.match(/^(\w+)\s*=\s*(\S+)$/);
		if (!kv) continue;

		const [, key, value] = kv;
		switch (key) {
			case 'Len':
				curLen = parseInt(value, 10);
				break;
			case 'Msg':
				curMsg = value;
				break;
			case 'MD':
				curMd = value;
				break;
		}
	}

	flush();
	return { digestLength, vectors };
}
