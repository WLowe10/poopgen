import path from "node:path";
import { execa, type Options as ExecaOptions } from "execa";

/**
 * Converts a string into valid node package format (kebab case)
 */
export const toValidNodePackageName = (name: string) =>
	name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/^[._]/, "")
		.replace(/[^a-z\d\-~]+/g, "-");

export const knownPackageManagers = ["npm", "yarn", "pnpm"] as const;

export type KnownPackageManager = (typeof knownPackageManagers)[number];

export function parseProjectName(name: string, basePath?: string) {
	const projectDir = basePath ? path.join(basePath, name) : path.join(process.cwd(), name);
	const projectName = path.basename(projectDir);
	const packageName = toValidNodePackageName(projectName);

	return {
		dir: projectDir,
		name: projectName,
		packageName,
	};
}

/**
 * Gets the current node package manager. Defaults to npm
 */
export function getNodePackageManager(): KnownPackageManager {
	const userAgent = process.env.npm_config_user_agent;

	if (!userAgent) {
		return "npm";
	}

	if (userAgent.startsWith("npm")) {
		return "npm";
	} else if (userAgent.startsWith("yarn")) {
		return "yarn";
	} else if (userAgent.startsWith("pnpm")) {
		return "pnpm";
	}

	return "npm";
}

/**
 * Installs node modules. Requires the selected package manager to be installed.
 */
export async function installNodeModules(packageManager: KnownPackageManager, opts?: ExecaOptions) {
	await execa(packageManager, ["install"], {
		...opts,
	});
}
