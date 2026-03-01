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

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runClosureCompiler } from './utils/closure.js';
import { BUILD_DIR, DIST_DIR, RESOURCES_DIR } from './config.js';
import type { IFeatureSet } from './utils/features.js';

/* ---- UMD envelope (split across array elements for legibility) ---- */

const UMD_HEADER = [
	`;(function(fallbackPkgName){`,
	`(function(global,factory){`,
	`if(typeof define==="function"&&define["amd"]){`,
	`define(["require","exports","module"],factory)`,
	`}else{`,
	`var isCjsMod=(typeof module==="object"&&typeof module["exports"]==="object");`,
	`var req=(typeof require==="function")?require:`,
	`function(n){throw new Error("Cannot find module '"+n+"'")};`,
	`var mod=isCjsMod?module:Object.create(null,{"exports":{`,
	`["configurable"]:true,["enumerable"]:true,["writable"]:true,`,
	`["value"]:Object.create(null)}});`,
	`var result=factory(req,mod["exports"],mod);`,
	`if(typeof result!=="undefined"){mod["exports"]=result}`,
	`if(!isCjsMod){global[fallbackPkgName]=mod["exports"]}`,
	`}})(this,function(require,exports,module){"use strict";var DEFAULT_EXPORT;`,
].join('');

const UMD_FOOTER = [
	`Object.defineProperty(DEFAULT_EXPORT, 'default', { value: DEFAULT_EXPORT, configurable: true, writable: true });`,
	`module.exports=DEFAULT_EXPORT})}).call(`,
	`typeof globalThis==="object"?globalThis:`,
	`typeof self==="object"?self:`,
	`typeof global==="object"?global:this,"sha2");`,
].join('');

/**
 * Produce a UMD / CJS build:
 *  1. Wrap the bundled source in a UMD envelope.
 *  2. Minify with Closure Compiler.
 */
export async function buildCjs(
	featureSet: IFeatureSet,
	wrappedJsPath: string,
	type: string,
): Promise<string> {
	const intermediaryPath = join(
		BUILD_DIR,
		`${featureSet.slug}.intermediary.${type}.cjs`,
	);
	const outputPath = join(DIST_DIR, `${featureSet.slug}.${type}.cjs`);

	const source = await readFile(wrappedJsPath, 'utf-8');
	const wrapped = [UMD_HEADER, source, UMD_FOOTER].join('\n');

	await writeFile(intermediaryPath, wrapped, 'utf-8');

	let externsFiles: string[] | undefined;
	if (type === 'wasm') {
		externsFiles = [join(RESOURCES_DIR, 'closure.externs.wasm.js')];
	}
	await runClosureCompiler(intermediaryPath, outputPath, externsFiles);

	return outputPath;
}
