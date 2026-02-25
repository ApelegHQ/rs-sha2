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

import { join } from 'node:path';
import { BUILD_DIR, CARGO_CONFIG, WORKSPACE_DIR } from './config.js';
import { exec } from './exec.js';
import type { IFeatureSet } from './features.js';

/**
 * Compile the Rust crate to a WASM binary via Cargo.
 * @returns Absolute path to the produced `.wasm` artefact.
 */
export async function buildCargo(IFeatureSet: IFeatureSet): Promise<string> {
	const cargoTargetDir = join(BUILD_DIR, IFeatureSet.slug);

	const rustflags = [
		process.env.RUSTFLAGS,
		'-Clink-arg=-z,relro',
		'-Clink-arg=--no-entry',
		'-Clink-arg=-static',
		'-Clink-arg=-v',
	]
		.filter(Boolean)
		.join(' ');

	await exec(
		'cargo',
		[
			'build',
			'--frozen',
			'--lib',
			'--target',
			CARGO_CONFIG.target,
			'--profile',
			CARGO_CONFIG.profile,
			'--package',
			CARGO_CONFIG.package,
			'--target-dir',
			cargoTargetDir,
			'--no-default-features',
			'--features',
			IFeatureSet.features.join(','),
		],
		{
			cwd: WORKSPACE_DIR,
			env: { RUSTFLAGS: rustflags },
		},
	);

	return join(
		cargoTargetDir,
		CARGO_CONFIG.target,
		CARGO_CONFIG.profile,
		CARGO_CONFIG.artifact,
	);
}
