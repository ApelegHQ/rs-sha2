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
import { RESOURCES_DIR } from '../config.js';
import { hasFeature, type IFeatureSet } from './features.js';

/**
 * Factory function that creates a bundle generator for `resources/wrapper.ts`.
 * This function configures esbuild with feature flags and optional plugins,
 * then returns a function that bundles the wrapper with the specified
 * feature set.
 *
 * @param outfile - Path to the output file for the bundled code.
 * @param plugins - Optional array of esbuild plugins to extend the bundling
 *                  process.
 * @returns A function that accepts an `IFeatureSet` and returns a Promise
 *          resolving to the path of the bundled + formatted output file.
 * @example
 * const bundle = bundleWrapperFactory('dist/output.js', [myPlugin]);
 * const output = await bundle(featureSet);
 */
export function bundleWrapperFactory(
	outfile: string,
	plugins?: esbuild.Plugin[],
): (featureSet: IFeatureSet) => Promise<string> {
	return async (featureSet) => {
		await esbuild.build({
			entryPoints: [join(RESOURCES_DIR, 'wrapper.ts')],
			bundle: true,
			format: 'esm',
			outfile,
			define: {
				'import.meta.features.sha224': String(
					hasFeature(featureSet, 'sha224'),
				),
				'import.meta.features.sha256': String(
					hasFeature(featureSet, 'sha256'),
				),
				'import.meta.features.sha384': String(
					hasFeature(featureSet, 'sha384'),
				),
				'import.meta.features.sha512': String(
					hasFeature(featureSet, 'sha512'),
				),
				'import.meta.features.sha512_256': String(
					hasFeature(featureSet, 'sha512_256'),
				),
				'import.meta.features.deserialize': String(
					hasFeature(featureSet, 'deserialize'),
				),
				'import.meta.features.serialize': String(
					hasFeature(featureSet, 'serialize'),
				),
			},
			plugins,
		});

		const raw = await readFile(outfile, 'utf-8');
		// Prettier is used for unquoting props, so that the Google Closure
		// Compiler can then minimise property names.
		const formatted = await prettier.format(raw, {
			filepath: outfile,
			quoteProps: 'as-needed',
		});
		await writeFile(outfile, formatted, 'utf-8');

		return outfile;
	};
}
