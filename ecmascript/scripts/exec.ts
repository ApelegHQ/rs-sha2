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

import { execFile, spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

export interface IExecResult {
	stdout: string;
	stderr: string;
}

/**
 * Spawn a command and wait for it to finish.
 * Rejects on non-zero exit code.
 */
export function exec(
	command: string,
	args: string[],
	options?: { cwd?: string; env?: Record<string, string> },
): Promise<IExecResult> {
	return new Promise((resolve, reject) => {
		execFile(
			command,
			args,
			{
				cwd: options?.cwd,
				env: { ...process.env, ...options?.env },
				maxBuffer: 50 * 1024 * 1024,
			},
			(error, stdout, stderr) => {
				if (error) {
					console.error(
						`Command failed: ${command} ${args.join(' ')}`,
					);
					if (stderr) console.error(stderr);
					reject(error);
				} else {
					resolve({ stdout, stderr });
				}
			},
		);
	});
}

/**
 * Spawn a command with inherited stdio so output streams to the
 * terminal in real time.  Resolves on exit 0, rejects otherwise.
 */
export function execInherit(
	command: string,
	args: string[],
	options?: { cwd?: string; env?: Record<string, string> },
): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: options?.cwd,
			env: { ...process.env, ...options?.env },
			stdio: 'inherit',
		});
		child.on('error', reject);
		child.on('close', (code) => {
			if (code !== 0) {
				reject(new Error(`Process exited with code ${code}`));
			} else {
				resolve();
			}
		});
	});
}

/** Create a directory (and parents) if it doesn't already exist. */
export async function ensureDir(dir: string): Promise<void> {
	await mkdir(dir, { recursive: true });
}
