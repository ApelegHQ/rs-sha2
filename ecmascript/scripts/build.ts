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

import { bundleWrapperEcmascript, bundleWrapperWasm } from './bundle.js';
import { buildCargo } from './cargo.js';
import { buildCjs } from './cjs.js';
import { BUILD_DIR, DIST_DIR } from './config.js';
import { copyAssets } from './copy-assets.js';
import { generateDeclarations } from './declarations.js';
import { buildEsm } from './esm.js';
import { generatePackageJson } from './package-json.js';
import { ensureDir } from './utils/exec.js';
import {
	generateFeatureCombinations,
	type IFeatureSet,
} from './utils/features.js';
import { convertWasmToJs } from './wasm2js.js';

/** Run every build step for a single feature combination. */
async function buildVariant(featureSet: IFeatureSet): Promise<void> {
	console.log('  Compiling Rust → WASM …');
	const wasmPath = await buildCargo(featureSet);

	console.log('  Bundling & formatting (WASM) …');
	const wrappedPathWasm = await bundleWrapperWasm(featureSet, wasmPath);

	console.log('  Converting WASM → JS …');
	const { wasmJsPath } = await convertWasmToJs(wasmPath, featureSet);

	console.log('  Bundling & formatting …');
	const wrappedPathEcmascript = await bundleWrapperEcmascript(
		featureSet,
		wasmJsPath,
	);

	console.log('  Building CJS + ESM outputs …');
	await Promise.all([
		buildCjs(featureSet, wrappedPathWasm, 'wasm'),
		buildCjs(featureSet, wrappedPathEcmascript, 'es'),
		buildEsm(featureSet, wrappedPathWasm, 'wasm'),
		buildEsm(featureSet, wrappedPathEcmascript, 'es'),
	]);

	console.log('  Generating type declarations …');
	await generateDeclarations(featureSet);
}

async function main(): Promise<void> {
	await ensureDir(BUILD_DIR);
	await ensureDir(DIST_DIR);

	const combinations = generateFeatureCombinations();

	for (const IFeatureSet of combinations) {
		console.log(`\n▸ Building [${IFeatureSet.features.join(', ')}]`);
		await buildVariant(IFeatureSet);
	}

	console.log('\n▸ Finalising …');

	console.log('  Copying static assets …');
	await copyAssets();

	console.log('  Generating package.json …');
	await generatePackageJson(combinations);

	console.log('\n✔ Build complete.\n');
}

main().catch((error: unknown) => {
	console.error('\n✘ Build failed:\n', error);
	process.exitCode = 1;
});
