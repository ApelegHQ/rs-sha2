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

import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST_DIR, PACKAGE_DIR, SCRIPTS_DIR } from './config.js';
import { ensureDir, exec, execInherit } from './exec.js';

const HARNESS_DIR = join(PACKAGE_DIR, '.test-harness');
const TESTS_SRC = join(PACKAGE_DIR, 'tests');

async function main(): Promise<void> {
	const loader = join(PACKAGE_DIR, './loader.mjs');

	// ---- 1. Build the package ------------------------------------------------
	console.log('\n▸ Building package …\n');
	if (process.argv[2] === '--no-build') {
		console.log(`  Skipped\n\n`);
	} else {
		await execInherit(process.argv[0], [
			'--import',
			loader,
			join(SCRIPTS_DIR, 'build.ts'),
		]);
	}

	// ---- 2. Read the built package name --------------------------------------
	const distPkg = JSON.parse(
		await readFile(join(DIST_DIR, 'package.json'), 'utf-8'),
	) as { name: string };
	console.log(`\n  Package: ${distPkg.name}`);

	// ---- 3. Create an isolated test harness ----------------------------------
	console.log('\n▸ Setting up test harness …');
	await rm(HARNESS_DIR, { recursive: true, force: true });
	await ensureDir(HARNESS_DIR);

	// 3a. Pack dist/ into a tarball
	const { stdout: packOut } = await exec(
		'npm',
		['pack', '--pack-destination', HARNESS_DIR],
		{ cwd: DIST_DIR },
	);
	const tgzFilename = packOut.trim().split('\n').pop()!;
	console.log(`  Packed → ${tgzFilename}`);

	// 3b. Write the harness package.json
	await writeFile(
		join(HARNESS_DIR, 'package.json'),
		JSON.stringify(
			{
				name: 'sha2-integration-tests',
				version: '0.0.0',
				private: true,
				type: 'module',
				dependencies: {
					[distPkg.name]: `./${tgzFilename}`,
				},
			},
			null,
			2,
		) + '\n',
	);

	// 3c. npm install inside the harness
	console.log('  Running npm install …');
	await exec('npm', ['install'], { cwd: HARNESS_DIR });

	// 3d. Copy test sources + vector files
	console.log('  Copying tests …');
	await cp(TESTS_SRC, join(HARNESS_DIR, 'tests'), { recursive: true });

	// ---- 4. Run tests --------------------------------------------------------
	console.log('\n▸ Running tests …\n');

	const entries = await readdir(join(HARNESS_DIR, 'tests'));
	const testFiles = entries
		.filter((f) => f.endsWith('.test.ts'))
		.sort()
		.map((f) => join('tests', f));

	if (testFiles.length === 0) {
		throw new Error('No *.test.ts files found in tests/');
	}

	// Run node's built-in test runner with tsx for TypeScript support.
	// tsx is resolved from the *parent* project; wasm-sha2 resolves from
	// the harness's own node_modules — exactly like a real consumer.
	await execInherit(
		process.argv[0],
		['--import', loader, '--test', ...testFiles],
		{
			cwd: HARNESS_DIR,
		},
	);

	console.log('\n✔ All tests passed.\n');
}

main().catch((error: unknown) => {
	console.error('\n✘ Tests failed:\n', error);
	process.exitCode = 1;
});
