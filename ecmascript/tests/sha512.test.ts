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

const sha2 = await getSha2Instance();

const skip = !sha2.sha512;
const getInstance = () => sha2.sha512();

const shortMsgVectors = loadVectors('SHA512ShortMsg.rsp');
const longMsgVectors = loadVectors('SHA512LongMsg.rsp');

testsFactory('SHA-512', getInstance, 'NIST ShortMsg', shortMsgVectors, skip);
testsFactory('SHA-512', getInstance, 'NIST LongMsg', longMsgVectors, skip);
