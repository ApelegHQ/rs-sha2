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

import binaryen from 'binaryen';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BUILD_DIR } from './config.js';
import { replaceAllRotl } from './replace-all-rotl.mjs';
import type { IFeatureSet } from './utils/features.js';

export async function optimizeWasm(
	featureSet: IFeatureSet,
	wasmPath: string,
	noRotl?: boolean,
): Promise<string> {
	const outfile = join(BUILD_DIR, `${featureSet.slug}.wasm`);
	const data = await readFile(wasmPath);

	const module = binaryen.readBinary(data);
	binaryen.setOptimizeLevel(3);
	binaryen.setShrinkLevel(1);

	if (noRotl) {
		// rotl is defined as a function, which makes ES execution slower
		replaceAllRotl(module);
	}

	module.optimize();

	const wasmData = module.emitBinary();
	await writeFile(outfile, wasmData);

	return outfile;
}
