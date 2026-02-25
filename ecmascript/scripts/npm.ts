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

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { exec, type IExecResult, type IExecOptions } from './exec.js';

const npm = (args: string[], options?: IExecOptions): Promise<IExecResult> => {
	if (process.platform !== 'win32') {
		return exec('npm', args, options);
	}

	// For Windows, the logic here is based on that of `npm.cmd`:
	const scriptDir = dirname(process.argv[0]);

	// Determine NODE_EXE
	let nodeExe = join(scriptDir, 'node.exe');
	if (!fs.existsSync(nodeExe)) {
		nodeExe = join(scriptDir, 'node');
		if (!fs.existsSync(nodeExe)) {
			nodeExe = 'node';
		}
	}

	// Set npm paths
	const npmPrefixJs = join(
		scriptDir,
		'node_modules',
		'npm',
		'bin',
		'npm-prefix.js',
	);
	let npmCliJs = join(scriptDir, 'node_modules', 'npm', 'bin', 'npm-cli.js');

	// Get npm prefix
	const prefixResult = spawnSync(nodeExe, [npmPrefixJs], {
		encoding: 'utf-8',
	});

	if (prefixResult.status !== 0) {
		console.error('Could not determine Node.js install directory');
		process.exit(1);
	}

	const npmPrefix = prefixResult.stdout.trim();
	const npmPrefixNpmCliJs = join(
		npmPrefix,
		'node_modules',
		'npm',
		'bin',
		'npm-cli.js',
	);

	if (fs.existsSync(npmPrefixNpmCliJs)) {
		npmCliJs = npmPrefixNpmCliJs;
	}

	// Execute npm-cli.js with all arguments
	return exec(process.argv[0], [npmCliJs, ...args], options);
};

export default npm;
