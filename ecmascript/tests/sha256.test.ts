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

import getSha2Instance from './get-sha2-instance.js';
import loadVectors from './load-vectors.js';
import testsFactory from './tests-factory.js';

const sha2Esm = await getSha2Instance();
const sha2Cjs = await getSha2Instance(undefined, true);
const sha2WasmEsm = await getSha2Instance('wasm', false);
const sha2WasmCjs = await getSha2Instance('wasm', false);

const skip = !sha2Esm.sha256;
const getEsmInstance = () => sha2Esm.sha256();
const getCjsInstance = () => sha2Cjs.sha256();
const getWasmEsmInstance = () => sha2WasmEsm.sha256();
const getWasmCjsInstance = () => sha2WasmCjs.sha256();

const shortMsgVectors = loadVectors('SHA256ShortMsg.rsp');
const longMsgVectors = loadVectors('SHA256LongMsg.rsp');

testsFactory(
	'SHA-256 (ES+ESM)',
	getEsmInstance,
	'NIST ShortMsg',
	shortMsgVectors,
	skip,
);
testsFactory(
	'SHA-256 (ES+ESM)',
	getEsmInstance,
	'NIST LongMsg',
	longMsgVectors,
	skip,
);

testsFactory(
	'SHA-256 (ES+CJS)',
	getCjsInstance,
	'NIST ShortMsg',
	shortMsgVectors,
	skip,
);
testsFactory(
	'SHA-256 (ES+CJS)',
	getCjsInstance,
	'NIST LongMsg',
	longMsgVectors,
	skip,
);

testsFactory(
	'SHA-256 (WASM+ESM)',
	getWasmEsmInstance,
	'NIST ShortMsg',
	shortMsgVectors,
	skip,
);
testsFactory(
	'SHA-256 (WASM+ESM)',
	getWasmEsmInstance,
	'NIST LongMsg',
	longMsgVectors,
	skip,
);

testsFactory(
	'SHA-256 (WASM+CJS)',
	getWasmCjsInstance,
	'NIST ShortMsg',
	shortMsgVectors,
	skip,
);
testsFactory(
	'SHA-256 (WASM+CJS)',
	getWasmCjsInstance,
	'NIST LongMsg',
	longMsgVectors,
	skip,
);
