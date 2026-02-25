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

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BUILD_DIR, WASM2JS_BIN } from './config.js';
import { exec } from './exec.js';
import type { IFeatureSet } from './features.js';

export interface IWasmJsResult {
	wasmJsPath: string;
	symbolsPath: string;
}

/**
 * Convert a `.wasm` binary to a JS module via wasm2js,
 * patch the output, and extract the exported symbol names.
 */
export async function convertWasmToJs(
	wasmPath: string,
	IFeatureSet: IFeatureSet,
): Promise<IWasmJsResult> {
	const wasmJsPath = join(BUILD_DIR, `${IFeatureSet.slug}.wasm.mjs`);
	const symbolsPath = join(BUILD_DIR, `${IFeatureSet.slug}.symbols.json`);

	// --- run wasm2js -----------------------------------------------------------
	await exec(WASM2JS_BIN, [
		'-O4',
		'--deterministic',
		'--vacuum',
		'--disable-mutable-globals',
		'--pedantic',
		'--emscripten',
		'--output',
		wasmJsPath,
		wasmPath,
	]);

	// --- patch -----------------------------------------------------------------
	let content = await readFile(wasmJsPath, 'utf-8');
	content = content.replaceAll(
		'Object.create(Object.prototype,',
		'Object.create(null,',
	);
	content +=
		'\n;export default function (a) { try { return Promise.resolve(instantiate(a)); } catch(e) { return Promise.reject(e); } };\n';
	await writeFile(wasmJsPath, content, 'utf-8');

	// --- extract exported symbols ---------------------------------------------
	const symbols = await extractSymbols(wasmJsPath);
	await writeFile(symbolsPath, JSON.stringify(symbols), 'utf-8');

	return { wasmJsPath, symbolsPath };
}

/**
 * Dynamically import the wasm2js module and collect the names of all
 * exported functions (excluding `memory`).
 */
async function extractSymbols(wasmJsPath: string): Promise<Record<string, 1>> {
	const mod = await import(pathToFileURL(wasmJsPath).href);
	const instance = mod.default(0);

	const symbols: Record<string, 1> = {};
	for (const key of Object.keys(instance)) {
		if (key !== 'memory') {
			symbols[key] = 1;
		}
	}
	return symbols;
}
