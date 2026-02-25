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

import type { Feature } from './config.js';

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
		if (!a.match(algoRegex) && a.match(algoRegex)) return 1;
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
 * Enumerate every feature combination that should be built.
 *
 * The nested loops mirror the original shell script.
 * Commented-out algorithm variants can be re-enabled by uncommenting.
 */
export function generateFeatureCombinations(): IFeatureSet[] {
	const results: IFeatureSet[] = [];

	const quickBuild = !!process.env.QUICK_BUILD;

	const serializationVariants: Feature[][] = [
		[],
		['deserialize', 'serialize'],
	];
	const sha224Variants: Feature[][] = quickBuild ? [[]] : [['sha224'], []];
	const sha256Variants: Feature[][] = [['sha256'], []];
	const sha384Variants: Feature[][] = [['sha384'], []];
	const sha512Variants: Feature[][] = quickBuild ? [[]] : [['sha512'], []];
	const sha512_256Variants: Feature[][] = quickBuild
		? [[]]
		: [['sha512_256'], []];

	for (const sd of serializationVariants) {
		for (const sha224 of sha224Variants) {
			for (const sha256 of sha256Variants) {
				for (const sha384 of sha384Variants) {
					for (const sha512 of sha512Variants) {
						for (const sha512_256 of sha512_256Variants) {
							const algos: Feature[] = [
								...sha224,
								...sha256,
								...sha384,
								...sha512,
								...sha512_256,
							];
							if (algos.length === 0) continue;
							results.push(
								makeIFeatureSet([...sd, ...algos, 'streaming']),
							);
						}
					}
				}
			}
		}
	}

	return results;
}
