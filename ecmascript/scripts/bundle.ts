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

import { readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { sep as posixSep } from 'node:path/posix';
import { BUILD_DIR } from './config.js';
import { bundleWrapperFactory } from './utils/bundle-factory.js';
import { type IFeatureSet } from './utils/features.js';

const wasmPathFormatter = (p: string) => {
	return (
		'..' + posixSep + relative(process.cwd(), p).replaceAll(sep, posixSep)
	);
};

/**
 * Bundles `resources/wrapper.ts` into an ECMAScript module with wasm2js
 * resolution.
 * Uses a custom resolver plugin to map the UUID placeholder to a real wasm JS
 * file.
 *
 * @param featureSet - Object containing feature flags to include in the build.
 * @param wasmJsPath - Path to the pre-compiled wasm2js output file.
 * @returns Path to the bundled + formatted output file.
 * @example
 * const output = await bundleWrapperEcmascript(
 *   { slug: 'sha256', ... },
 *   './wasm/your-wasm.js'
 * );
 */ export async function bundleWrapperEcmascript(
	featureSet: IFeatureSet,
	wasmJsPath: string,
): Promise<string> {
	const outfile = join(BUILD_DIR, `${featureSet.slug}.wrapped.es.js`);

	return bundleWrapperFactory(outfile, [
		{
			name: 'resolver',
			setup(build) {
				build.onResolve(
					{
						filter: /^urn:uuid:2ba445c2-d903-4f19-abd0-c41d2cfd72f1$/,
						namespace: 'file',
					},
					(args) => {
						return build.resolve(wasmPathFormatter(wasmJsPath), {
							importer: args.importer,
							namespace: args.namespace,
							resolveDir: args.resolveDir,
							kind: args.kind,
							pluginData: args.pluginData,
							with: args.with,
						});
					},
				);
			},
		},
	])(featureSet);
}

/**
 * Bundles `resources/wrapper.ts` with the wasm module embedded as base64.
 * Uses two specialised plugins:
 * 1. Resolves the UUID to a custom `wasm-instantiate.ts` module
 * 2. Loads the actual wasm file as base64 string
 *
 * @param featureSet - Object containing feature flags to include in the build.
 * @param wasmPath - Path to the original wasm file (not wasm2js).
 * @returns Path to the bundled + formatted output file containing embedded wasm.
 * @example
 * const output = await bundleWrapperWasm(
 *   { slug: 'sha512', ... },
 *   './wasm/your-wasm.wasm'
 * );
 */
export async function bundleWrapperWasm(
	featureSet: IFeatureSet,
	wasmPath: string,
): Promise<string> {
	const outfile = join(BUILD_DIR, `${featureSet.slug}.wrapped.wasm.js`);

	void wasmPath;

	return bundleWrapperFactory(outfile, [
		{
			name: 'resolver',
			setup(build) {
				build.onResolve(
					{
						filter: /^urn:uuid:2ba445c2-d903-4f19-abd0-c41d2cfd72f1$/,
						namespace: 'file',
					},
					(args) => {
						return build.resolve('./wasm-instantiate.ts', {
							importer: args.importer,
							namespace: args.namespace,
							resolveDir: args.resolveDir,
							kind: args.kind,
							pluginData: args.pluginData,
							with: args.with,
						});
					},
				);

				build.onResolve(
					{
						filter: /^urn:uuid:0a426584-7134-49f9-ad16-bae3759aeb1c$/,
						namespace: 'file',
					},
					(args) => {
						return {
							pluginName: 'resolver',
							path: args.path,
							external: false,
							sideEffects: false,
							namespace: 'resolver',
						};
					},
				);

				build.onLoad(
					{
						filter: /^urn:uuid:0a426584-7134-49f9-ad16-bae3759aeb1c$/,
						namespace: 'resolver',
					},
					async () => {
						const file = await readFile(wasmPath, {
							encoding: null,
						});

						return {
							contents: `export var base64Text = ${JSON.stringify(file.toString('base64'))};`,
						};
					},
				);
			},
		},
	])(featureSet);
}
