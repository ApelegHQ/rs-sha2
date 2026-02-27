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
import { runClosureCompiler } from './closure.js';
import { BUILD_DIR, DIST_DIR } from './config.js';
import type { IFeatureSet } from './features.js';

const ESM_HEADER = 'var DEFAULT_EXPORT;';
const ESM_FOOTER = `;if(typeof exports==="undefined")exports=DEFAULT_EXPORT`;

/**
 * Produce an ESM build:
 *  1. Wrap the bundled source with a minimal ESM envelope.
 *  2. Minify with Closure Compiler.
 *  3. Post-process: hoist an `exports` binding and append a default export.
 */
export async function buildEsm(
	featureSet: IFeatureSet,
	wrappedJsPath: string,
): Promise<string> {
	const intermediary1Path = join(
		BUILD_DIR,
		`${featureSet.slug}.intermediary1.mjs`,
	);
	const intermediary2Path = join(
		BUILD_DIR,
		`${featureSet.slug}.intermediary2.mjs`,
	);
	const outputPath = join(DIST_DIR, `${featureSet.slug}.mjs`);

	/* ---- wrap ---- */
	const source = await readFile(wrappedJsPath, 'utf-8');
	const wrapped = [ESM_HEADER, source, ESM_FOOTER].join('\n');
	await writeFile(intermediary1Path, wrapped, 'utf-8');

	/* ---- minify ---- */
	await runClosureCompiler(intermediary1Path, intermediary2Path);

	/* ---- post-process ---- */
	const minified = await readFile(intermediary2Path, 'utf-8');

	// Prepend `var exports;` to the very first line
	// Append `;export default exports;` to the very last line
	const finalText = [
		'var exports;',
		minified.replace(/;*$/, ';export default exports;'),
	].join('');

	await writeFile(outputPath, finalText, 'utf-8');

	return outputPath;
}
