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

import { copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST_DIR, RESOURCES_DIR } from './config.js';

/** Static files to copy verbatim into the distribution directory. */
const ASSETS = [
	'types.d.cts',
	'types.d.mts',
	'README.md',
	'../../LICENSE',
] as const;

/**
 * Copy static assets from the source directory into the dist directory.
 */
export async function copyAssets(): Promise<void> {
	await Promise.all(
		ASSETS.map((file) =>
			copyFile(join(RESOURCES_DIR, file), join(DIST_DIR, file)),
		),
	);
}
