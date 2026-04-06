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
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BUILD_DIR, INITIAL_MEMORY, MAX_MEMORY } from './config.js';
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

	// START: Memory info assertions
	// Avoids needing to set `import.meta.runtimeHeapSizeAssertions`
	const memoryInfo = module.getMemoryInfo();
	const memorySize = (memoryInfo.initial * 64) << 10;
	assert.equal(memorySize, INITIAL_MEMORY);
	if (MAX_MEMORY) {
		assert.equal((memoryInfo.max! * 64) << 10, MAX_MEMORY);
	}

	const heapBaseExport = module.getExport('__heap_base');
	const heapBaseExportInfo = binaryen.getExportInfo(heapBaseExport);
	assert.equal(heapBaseExportInfo.kind, binaryen.ExternalKinds.Global);
	assert.equal(heapBaseExportInfo.name, '__heap_base');

	const heapBaseGlobalInfo = binaryen.getGlobalInfo(heapBaseExport);
	assert.equal(heapBaseGlobalInfo.name, '__heap_base');

	{
		const mod = await WebAssembly.instantiate(data);
		assert(
			mod.instance.exports['__heap_base'] instanceof WebAssembly.Global,
		);
		// Ensure there's enough room in the heap. 1 KiB should be enough
		// to allocate all necessary information (albeit too little for good
		// performance).
		const heapBase = mod.instance.exports['__heap_base'].value;
		assert(typeof heapBase === 'number');
		assert(Number.isSafeInteger(heapBase));
		assert(heapBase >= 0);
		assert(heapBase <= INITIAL_MEMORY - 1024);
	}
	// END: Memory info assertions

	if (noRotl) {
		// rotl is defined as a function, which makes ES execution slower
		replaceAllRotl(module);
	}

	module.optimize();

	const wasmData = module.emitBinary();
	await writeFile(outfile, wasmData);

	return outfile;
}
