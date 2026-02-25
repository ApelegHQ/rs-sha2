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

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* eslint-disable @typescript-eslint/naming-convention */
export const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

/** Root of the JS package (parent of scripts/). */
export const PACKAGE_DIR = resolve(SCRIPTS_DIR, '..');

/** Root of the Rust workspace (parent of the JS package). */
export const WORKSPACE_DIR = resolve(PACKAGE_DIR, '..');

/** Intermediate build artefacts. */
export const BUILD_DIR = join(PACKAGE_DIR, 'build');

/** Final distributable output. */
export const DIST_DIR = join(PACKAGE_DIR, 'dist');

/** JS source directory (wrapper, declaration templates). */
export const RESOURCES_DIR = join(PACKAGE_DIR, 'resources');

/** Path to the wasm2js binary (overridable via $WASM2JS). */
export const WASM2JS_BIN = process.env.WASM2JS ?? 'wasm2js';

/** Cargo build settings. */
export const CARGO_CONFIG = {
	target: 'wasm32v1-none',
	profile: 'release',
	package: 'wasm-sha2',
	artifact: 'wasm_sha2.wasm',
} as const;

/** Every feature flag the crate understands. */
export type Feature =
	| 'sha224'
	| 'sha256'
	| 'sha384'
	| 'sha512'
	| 'sha512_256'
	| 'deserialize'
	| 'serialize'
	| 'streaming';
