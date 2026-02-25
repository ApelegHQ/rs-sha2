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

import * as esbuild from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as prettier from 'prettier';
import { BUILD_DIR, RESOURCES_DIR } from './config.js';
import { hasFeature, type IFeatureSet } from './features.js';

/**
 * Bundle `resources/wrapper.ts` with esbuild — resolving the wasm2js module via
 * an alias and injecting compile-time feature flags — then format the result
 * with Prettier.
 *
 * @returns Path to the bundled + formatted output file.
 */
export async function bundleWrapper(
	IFeatureSet: IFeatureSet,
	wasmJsPath: string,
): Promise<string> {
	const outfile = join(BUILD_DIR, `${IFeatureSet.slug}.wrapped.js`);

	await esbuild.build({
		entryPoints: [join(RESOURCES_DIR, 'wrapper.ts')],
		bundle: true,
		format: 'esm',
		outfile,
		alias: {
			'about:src': wasmJsPath,
		},
		define: {
			'import.meta.features.sha224': String(
				hasFeature(IFeatureSet, 'sha224'),
			),
			'import.meta.features.sha256': String(
				hasFeature(IFeatureSet, 'sha256'),
			),
			'import.meta.features.sha384': String(
				hasFeature(IFeatureSet, 'sha384'),
			),
			'import.meta.features.sha512': String(
				hasFeature(IFeatureSet, 'sha512'),
			),
			'import.meta.features.sha512_256': String(
				hasFeature(IFeatureSet, 'sha512_256'),
			),
			'import.meta.features.deserialize': String(
				hasFeature(IFeatureSet, 'deserialize'),
			),
			'import.meta.features.serialize': String(
				hasFeature(IFeatureSet, 'serialize'),
			),
		},
	});

	const raw = await readFile(outfile, 'utf-8');
	const formatted = await prettier.format(raw, { filepath: outfile });
	await writeFile(outfile, formatted, 'utf-8');

	return outfile;
}
