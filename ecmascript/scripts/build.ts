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

import { spawn } from 'node:child_process';
import { cpus } from 'node:os';

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

function getDefaultRunnerCount(): number {
	return cpus().length + 1;
}

function parseRunnerCount(defaultRunnerCount: number): number {
	const { argv } = process;

	for (let index = 2; index < argv.length; index += 1) {
		const argument = argv[index];

		if (argument === '--jobs' || argument === '-j') {
			const value = argv[index + 1];

			if (value === undefined) {
				throw new Error(`Missing value for ${argument}.`);
			}

			const parsed = Number.parseInt(value, 10);

			if (!Number.isInteger(parsed) || parsed < 1) {
				throw new Error(
					`Invalid runner count "${value}". Expected an integer >= 1.`,
				);
			}

			return parsed;
		}

		if (argument.startsWith('--jobs=')) {
			const value = argument.slice('--jobs='.length);
			const parsed = Number.parseInt(value, 10);

			if (!Number.isInteger(parsed) || parsed < 1) {
				throw new Error(
					`Invalid runner count "${value}". Expected an integer >= 1.`,
				);
			}

			return parsed;
		}

		if (argument.startsWith('-j')) {
			const value = argument.slice('-j'.length);

			if (value.length === 0) {
				continue;
			}

			const parsed = Number.parseInt(value, 10);

			if (!Number.isInteger(parsed) || parsed < 1) {
				throw new Error(
					`Invalid runner count "${value}". Expected an integer >= 1.`,
				);
			}

			return parsed;
		}
	}

	return defaultRunnerCount;
}

function parseWorkerIndex(): number | undefined {
	const { argv } = process;

	for (let index = 2; index < argv.length; index += 1) {
		const argument = argv[index];

		if (argument === '--worker-index') {
			const value = argv[index + 1];

			if (value === undefined) {
				throw new Error('Missing value for --worker-index.');
			}

			const parsed = Number.parseInt(value, 10);

			if (!Number.isInteger(parsed) || parsed < 0) {
				throw new Error(
					`Invalid worker index "${value}". Expected an integer >= 0.`,
				);
			}

			return parsed;
		}

		if (argument.startsWith('--worker-index=')) {
			const value = argument.slice('--worker-index='.length);
			const parsed = Number.parseInt(value, 10);

			if (!Number.isInteger(parsed) || parsed < 0) {
				throw new Error(
					`Invalid worker index "${value}". Expected an integer >= 0.`,
				);
			}

			return parsed;
		}
	}

	return undefined;
}

async function runWorkerProcess(
	featureSet: IFeatureSet,
	index: number,
	total: number,
): Promise<void> {
	console.log(
		`\n▸ [${index + 1}/${total}] Building [${featureSet.features.join(', ')}]`,
	);

	await new Promise<void>((resolve, reject) => {
		const child = spawn(
			process.execPath,
			[
				'--import',
				'./loader.mjs',
				'scripts/build.ts',
				'--worker-index',
				String(index),
			],
			{
				cwd: process.cwd(),
				stdio: 'inherit',
			},
		);

		child.on('error', reject);
		child.on('exit', (code, signal) => {
			if (code === 0) {
				resolve();
				return;
			}

			reject(
				new Error(
					`Worker ${index} failed with ${
						signal === null
							? `exit code ${String(code)}`
							: `signal ${signal}`
					}.`,
				),
			);
		});
	});
}

async function runPool(
	items: readonly IFeatureSet[],
	runnerCount: number,
): Promise<void> {
	let nextIndex = 0;

	const workers = Array.from(
		{ length: Math.min(runnerCount, items.length) },
		async () => {
			while (true) {
				const currentIndex = nextIndex;
				nextIndex += 1;

				const item = items[currentIndex];

				if (item === undefined) {
					return;
				}

				await runWorkerProcess(item, currentIndex, items.length);
			}
		},
	);

	await Promise.all(workers);
}

/** Run every build step for a single feature combination. */
async function buildVariant(featureSet: IFeatureSet): Promise<void> {
	const prefix = `[${featureSet.slug}]`;

	console.log(`${prefix} Compiling Rust → WASM …`);

	const clonedFeatureSet = structuredClone(featureSet);
	clonedFeatureSet.features.push('sha2-compress-unrolled');
	clonedFeatureSet.slug = clonedFeatureSet.slug + '+sha2-compress-unrolled';

	const [wasmPathUnrolled, wasmPathCompact] = await Promise.all([
		buildCargo(clonedFeatureSet),
		buildCargo(featureSet),
	]);

	console.log(`${prefix} Bundling & formatting (WASM) …`);
	const wrappedPathWasm = await bundleWrapperWasm(
		featureSet,
		wasmPathUnrolled,
	);

	console.log(`${prefix} Converting WASM → JS …`);
	const { wasmJsPath } = await convertWasmToJs(wasmPathCompact, featureSet);

	console.log(`${prefix} Bundling & formatting …`);
	const wrappedPathEcmascript = await bundleWrapperEcmascript(
		featureSet,
		wasmJsPath,
	);

	console.log(`${prefix} Building CJS + ESM outputs …`);
	await Promise.all([
		buildCjs(featureSet, wrappedPathWasm, 'wasm'),
		buildCjs(featureSet, wrappedPathEcmascript, 'es'),
		buildEsm(featureSet, wrappedPathWasm, 'wasm'),
		buildEsm(featureSet, wrappedPathEcmascript, 'es'),
	]);

	console.log(`${prefix} Generating type declarations …`);
	await generateDeclarations(featureSet);
}

async function main(): Promise<void> {
	await ensureDir(BUILD_DIR);
	await ensureDir(DIST_DIR);

	const combinations = generateFeatureCombinations();
	const defaultRunnerCount = getDefaultRunnerCount();
	const runnerCount = parseRunnerCount(defaultRunnerCount);

	const workerIndex = parseWorkerIndex();

	if (workerIndex !== undefined) {
		const featureSet = combinations[workerIndex];

		if (featureSet === undefined) {
			throw new Error(`Worker index ${workerIndex} is out of range.`);
		}

		await buildVariant(featureSet);
		return;
	} else {
		console.log(
			`\n▸ Building ${combinations.length} variant(s) with ${runnerCount} runner(s)…`,
		);
	}

	await runPool(combinations, runnerCount);

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
