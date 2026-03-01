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

import { load } from 'js-toml';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST_DIR, PACKAGE_DIR, RESOURCES_DIR } from './config.js';
import type { IFeatureSet } from './utils/features.js';

/**
 * Build the `import` / `require` condition block for a single variant.
 */
function makeConditionEntry(fs: IFeatureSet, type: string) {
	return {
		import: {
			types: `./${fs.slug}.d.mts`,
			default: `./${fs.slug}.${type}.mjs`,
		},
		require: {
			types: `./${fs.slug}.d.cts`,
			default: `./${fs.slug}.${type}.cjs`,
		},
	};
}

/**
 * Return the variant with the most features enabled.
 * Ties are broken by lexicographic slug order (deterministic).
 */
function mostFeaturedVariant(featureSets: IFeatureSet[]): IFeatureSet {
	return [...featureSets].sort((a, b) => {
		const diff = b.features.length - a.features.length;
		if (diff !== 0) return diff;
		return a.slug.localeCompare(b.slug);
	})[0];
}

/**
 * Read `src/package.json.in`, populate `main`, `module`, `types`, and
 * `exports`, then write the result to `dist/package.json`.
 */
export async function generatePackageJson(
	featureSets: IFeatureSet[],
): Promise<void> {
	const template = JSON.parse(
		await readFile(join(RESOURCES_DIR, 'package.json.in'), 'utf-8'),
	);

	const projectData = load(
		await readFile(join(PACKAGE_DIR, '../Cargo.toml'), 'utf-8'),
	) as {
		workspace: {
			package: {
				keywords: string[];
				license: string;
				repository: string;
				version: string;
			};
		};
	};

	template.keywords = projectData.workspace.package.keywords;
	template.license = projectData.workspace.package.license;
	template.repository = projectData.workspace.package.repository;
	template.version = projectData.workspace.package.version;

	const primary = mostFeaturedVariant(featureSets);

	// --- top-level convenience fields (for legacy bundlers) ---
	template.main = `./${primary.slug}.es.cjs`;
	template.module = `./${primary.slug}.es.mjs`;
	template.types = `./${primary.slug}.d.cts`;

	// --- exports map ---
	const exports: Record<string, unknown> = {};

	// Bare "." → most-featured variant
	exports['.'] = makeConditionEntry(primary, 'es');
	exports['./wasm'] = makeConditionEntry(primary, 'wasm');

	// Named sub-paths for every variant (including the primary)
	for (const fs of featureSets) {
		exports[`./${fs.slug}`] = makeConditionEntry(fs, 'es');
		exports[`./wasm/${fs.slug}`] = makeConditionEntry(fs, 'wasm');
	}

	template.exports = exports;

	await writeFile(
		join(DIST_DIR, 'package.json'),
		JSON.stringify(template, null, 2) + '\n',
		'utf-8',
	);
}
