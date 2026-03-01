/**
 * @copyright
 * Copyright © 2026 Apeleg Limited. All rights reserved.
 *
 * Permission to use; copy; modify; and distribute this software for any
 * purpose with or without fee is hereby granted; provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL; DIRECT;
 * INDIRECT; OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE; DATA OR PROFITS; WHETHER IN AN ACTION OF CONTRACT; NEGLIGENCE OR
 * OTHER TORTIOUS ACTION; ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

import { Sha256 as AwsCrypto } from '@aws-crypto/sha256-js';
import fastSha256 from 'fast-sha256';
import hashWasm from 'hash-wasm';
import { sha256 as jsSha256 } from 'js-sha256';
import jssha from 'jssha';
import assert from 'node:assert';
import shajs from 'sha.js';
import { createHash as sha256Uint8array } from 'sha256-uint8array';
import apelegSha2Es from '../../dist/sha256+streaming.es.mjs';
import apelegSha2Wasm from '../../dist/sha256+streaming.wasm.mjs';

const apelegEs = (await apelegSha2Es()).sha256().digest;
const apelegWasm = (await apelegSha2Wasm()).sha256().digest;

// Configuration
// 1 KB to 8 MB
const BUFFER_SIZES = [1_024, 8_192, 65_536, 131_072, 1_048_576, 8_388_608];
const TRIALS = 32;
const ITERATIONS_PER_TRIAL = 128;
const ITERATIONS = TRIALS * ITERATIONS_PER_TRIAL;
const WARMUP_ITERATIONS = 64;

// Utility functions
function println(s) {
	process.stdout.write(s + '\n');
}

function formatBytes(bytes) {
	if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MiB';
	if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KiB';
	return bytes + ' B';
}

async function measureTime(fn, warmupIterations, iterations) {
	for (let i = 0; i < warmupIterations; i++) {
		const result = fn();
		if (result && typeof result.then === 'function') {
			await result;
		}
	}

	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		const result = fn();
		if (result && typeof result.then === 'function') {
			await result;
		}
	}

	return performance.now() - start;
}

async function benchmarkBufferSize(bufferSize) {
	// Setup test data
	const buffer = new Uint8Array(bufferSize);
	for (let i = 0; i < buffer.byteLength; i++) {
		buffer[i] = i & 0xff;
	}

	// Define implementations
	const implementations = [
		{
			name: 'SubtleCrypto.digest',
			fn: (buffer) => crypto.subtle.digest({ name: 'SHA-256' }, buffer),
			async: true,
		},
		{
			name: '@apeleghq/sha2 (WASM)',
			fn: (buffer) => apelegWasm(buffer),
			async: false,
		},
		{
			name: '@apeleghq/sha2 (ES)',
			fn: (buffer) => apelegEs(buffer),
			async: false,
		},
		{
			name: '@aws-crypto/sha256-js',
			fn: (buffer) => {
				const hash = new AwsCrypto();
				hash.update(buffer);
				return hash.digest();
			},
			async: true,
		},
		{
			name: 'fast-sha256',
			fn: (buffer) => fastSha256(buffer),
			async: false,
		},
		{
			name: 'hash-wasm',
			fn: (buffer) => hashWasm.sha256(buffer),
			async: false,
		},
		{
			name: 'js-sha256',
			fn: (buffer) => jsSha256.arrayBuffer(buffer),
			async: false,
		},
		{
			name: 'jssha',
			fn: (buffer) =>
				new jssha('SHA-256', 'UINT8ARRAY')
					.update(buffer)
					.getHash('ARRAYBUFFER'),
			async: false,
		},
		{
			name: 'sha.js',
			fn: (buffer) => shajs('sha256').update(buffer).digest(),
			async: false,
		},
		{
			name: 'sha256-uint8array',
			fn: (buffer) => sha256Uint8array().update(buffer).digest(),
			async: false,
		},
	];

	const expected = new Uint8Array(32);
	expected.set(
		Buffer.from(
			'f5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b',
			'hex',
		),
	);
	await implementations.map(async (impl) => {
		const result = await impl.fn(new Uint8Array(64));
		if (result instanceof Buffer) {
			assert.deepStrictEqual(
				new Uint8Array(
					result.buffer,
					result.byteOffset,
					result.byteLength,
				),
				expected,
				impl.name,
			);
		} else if (result instanceof Uint8Array) {
			assert.deepStrictEqual(result, expected, impl.name);
		} else if (result instanceof ArrayBuffer) {
			assert.deepStrictEqual(result, expected.buffer, impl.name);
		} else {
			assert.strictEqual(
				result,
				'f5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b',
			);
		}
	});

	// Benchmark each implementation
	const results = Object.fromEntries(
		implementations.map((impl) => [impl.name, []]),
	);

	for (let trial = 0; trial < TRIALS + 2; trial++) {
		const shuffledImplementations = Array.from(implementations);
		for (let i = shuffledImplementations.length - 1; i > 0; i--) {
			const j = Math.floor((0, Math.random()) * (i + 1));
			const temp = shuffledImplementations[j];
			shuffledImplementations[j] = shuffledImplementations[i];
			shuffledImplementations[i] = temp;
		}

		for (const impl of shuffledImplementations) {
			results[impl.name].push(
				await measureTime(
					() => impl.fn(buffer),
					WARMUP_ITERATIONS,
					ITERATIONS_PER_TRIAL,
				),
			);
		}
	}

	return Object.fromEntries(
		Object.entries(results).map(([name, times]) => {
			// Drop smallest and largest values to prevent tail values from
			// affecting the result too much.
			times = times.sort((a, b) => a - b).slice(1, TRIALS + 1);
			return [name, times.reduce((acc, cv) => acc + cv, 0)];
		}),
	);
}

async function runBenchmark() {
	println('Running SHA-256 Benchmark...\n');

	const allResults = {};
	for (const bufferSize of BUFFER_SIZES) {
		allResults[bufferSize] = await benchmarkBufferSize(bufferSize);
	}

	// Display results
	println('='.repeat(80));
	println(
		'SHA-256 BENCHMARK RESULTS'.padEnd(50, ' ') + ' (All values in ms)',
	);
	println('='.repeat(80));

	for (const bufferSize of BUFFER_SIZES) {
		const results = allResults[bufferSize];
		const formattedSize = formatBytes(bufferSize);

		// start results output
		println(`\nBuffer Size: ${formattedSize} | Iterations: ${ITERATIONS}`);
		println('-'.repeat(80));
		println(
			`${'Package'.padEnd(27)} ${'Time (ms)'.padEnd(15)} ${'Ops/s'.padEnd(11)} ${'MiB/s'.padEnd(10)} ${'Relative'.padEnd(10)}`.trimEnd(),
		);
		println('-'.repeat(80));

		const sortedResults = Object.entries(results).sort(
			(a, b) => a[1] - b[1],
		);
		const fastestTime = sortedResults[0][1];

		// Print numbers aligned by their decimal dot
		function alignNumber(value, intWidth, fracWidth) {
			const parts = Number(value).toFixed(fracWidth).split('.');
			const intPart = parts[0].padStart(intWidth);
			const fracPart = parts[1];
			return `${intPart}.${fracPart}`;
		}

		const resultRows = sortedResults.map(([name, time]) => {
			const opsPerSec = ITERATIONS / (time / 1000);
			const bytesPerSec = (bufferSize * ITERATIONS) / (time / 1000);
			const mibPerSec = bytesPerSec / (1024 * 1024);
			const ratio = time / fastestTime;

			const nameCol = name.padEnd(27);
			const timeCol = alignNumber(time, 11, 3);
			const opsCol = alignNumber(opsPerSec, 8, 2);
			const mibCol = alignNumber(mibPerSec, 7, 2);
			const ratioCol = alignNumber(ratio, 7, 2);

			return [nameCol, timeCol, opsCol, mibCol, ratioCol];
		});

		const outputReflows = resultRows.reduce((acc, cv) => {
			cv.forEach((v, i) => {
				if (acc[i] === 0) return;
				if (!v.startsWith(' ')) {
					acc[i] = 0;
					return;
				}
				const startPos = Math.max(v.lastIndexOf(' '), 0);
				if (acc[i] === undefined || startPos < acc[i]) {
					acc[i] = startPos;
				}
			});

			return acc;
		}, []);

		resultRows.forEach((row, index) => {
			println(
				row
					.map((val, i) => {
						const f = val.slice(outputReflows[i]);
						if (f.trim() !== val.trim()) {
							throw new Error('Reflow error');
						}
						return f + val.slice(0, outputReflows[i]);
					})
					.join(' ') + (index === 0 ? ' ⭐' : ''),
			);
		});
		// end results output

		println('='.repeat(80));
	}

	println('\n' + '='.repeat(80));
	println('SUMMARY: Fastest package by buffer size');
	println('='.repeat(80));
	println(`${'Buffer Size'.padEnd(20)} ${'Fastest Package'}`);
	println('-'.repeat(80));

	for (const bufferSize of BUFFER_SIZES) {
		const results = allResults[bufferSize];
		const fastest = Object.entries(results).sort(
			(a, b) => a[1] - b[1],
		)[0][0];
		const formattedSize = formatBytes(bufferSize);
		println(`${formattedSize.padEnd(20)} ${fastest}`);
	}

	println('='.repeat(80));
}

// Execute benchmark
runBenchmark().catch(console.error);
