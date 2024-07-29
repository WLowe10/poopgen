import fs from "fs";
import path from "path";
import { execa, type Options } from "execa";

/**
 * Returns a boolean representing if the directory contains a git repository.
 */
export async function dirHasGitRepo(dir: string) {
	return fs.existsSync(path.join(dir, ".git"));
}

/**
 * Returns a boolean representing if the directory is within a git repository.
 */
export async function dirIsInsideGitRepo(dir: string, opts?: Options) {
	try {
		await execa("git", ["rev-parse", "--is-inside-work-tree"], {
			cwd: dir,
			stdout: "ignore",
			...opts,
		});
	} catch {
		return false;
	}
}

/**
 * Initializes a Git repository. Requires Git to be installed.
 */
export async function initGit(opts?: Options) {
	return await execa("git", ["init"], opts);
}
