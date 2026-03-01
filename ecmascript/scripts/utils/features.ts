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

import type { Feature } from '../config.js';

/** A resolved set of features with derived naming strings. */
export interface IFeatureSet {
	/** Sorted, deduplicated feature list. */
	features: Feature[];
	/** `+`-separated slug used for file naming (e.g. `sha256+sha384+streaming`). */
	slug: string;
	/** TypeScript union literal (e.g. `'sha256' | 'sha384' | 'streaming'`). */
	typeUnion: string;
}

/** Check whether a feature set includes a specific feature. */
export function hasFeature(fs: IFeatureSet, feature: Feature): boolean {
	return fs.features.includes(feature);
}

const algoRegex = /^sha\d+/;
function makeIFeatureSet(raw: Feature[]): IFeatureSet {
	const sorted = [...new Set(raw)].sort((a, b) => {
		if (a.match(algoRegex) && !b.match(algoRegex)) return -1;
		if (!a.match(algoRegex) && b.match(algoRegex)) return 1;
		if (a < b) return -1;
		if (a > b) return 1;
		return 0;
	}) as Feature[];
	return {
		features: sorted,
		slug: sorted.join('+'),
		typeUnion: sorted.map((f) => `'${f}'`).join(' | '),
	};
}

/**
 * Computes the cartesian product across feature dimensions.
 *
 * Each "dimension" is an array of mutually exclusive options, where each
 * option is itself a list of features.  The result contains every possible
 * pick-one-from-each-dimension combination, with the selected options
 * concatenated.
 */
function cartesian(dimensions: Feature[][][]): Feature[][] {
	return dimensions.reduce<Feature[][]>(
		(acc, dimension) =>
			acc.flatMap((prev) =>
				dimension.map((option) => [...prev, ...option]),
			),
		[[]],
	);
}

/**
 * Parse the `FEATURES` environment variable into a set of feature names.
 *
 * Returns `null` when the variable is unset or empty, which signals that
 * all features should participate in the combinatorial matrix (full build).
 */
function parseFeaturesEnv(): Set<Feature> | null {
	const raw = process.env.FEATURES;
	if (!raw) return null;
	const features = raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean) as Feature[];
	return features.length > 0 ? new Set(features) : null;
}

/** All known algorithm features. */
const allAlgorithms: Feature[] = [
	'sha224',
	'sha256',
	'sha384',
	'sha512',
	'sha512_256',
];

/**
 * Enumerate every feature combination that should be built.
 *
 * Feature selection is driven by the `FEATURES` environment variable.
 * When set it should contain a comma-separated list of features that
 * participate in the combinatorial matrix (e.g. `FEATURES=sha256,sha384`).
 * When unset every known feature is included (full build).
 *
 * Special rules:
 * - **Serialization / deserialization** are treated as a single unit.
 *   The dimension is only active when *both* `serialize` and
 *   `deserialize` appear in `FEATURES` (or when `FEATURES` is unset).
 * - **Streaming** is always enabled and does not need to be listed.
 */
export function generateFeatureCombinations(): IFeatureSet[] {
	const envFeatures = parseFeaturesEnv();

	// ── Algorithm dimensions ─────────────────────────────────────────
	// An algorithm participates in the matrix (present/absent) when it
	// appears in `FEATURES`, or when no override is given.
	const algoDimensions: Feature[][][] = allAlgorithms.map((algo) => {
		const enabled = envFeatures === null || envFeatures.has(algo);
		return enabled ? [[algo], []] : [[]];
	});

	// ── Serialization dimension ──────────────────────────────────────
	// Active only when both halves are requested (or no override given).
	const serializationEnabled =
		envFeatures === null ||
		(envFeatures.has('serialize') && envFeatures.has('deserialize'));

	const serializationDimension: Feature[][] = serializationEnabled
		? [[], ['deserialize', 'serialize']]
		: [[]];

	// ── Combine, filter, and build ───────────────────────────────────
	// Streaming is always on and appended unconditionally.
	return cartesian([serializationDimension, ...algoDimensions])
		.filter((combo) => combo.some((f) => algoRegex.test(f)))
		.map((combo) => makeIFeatureSet([...combo, 'streaming']));
}
