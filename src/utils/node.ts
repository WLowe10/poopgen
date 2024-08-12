import path from "path";
import { execa, type Options } from "execa";

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

export const supportedPackageManagers = ["npm", "yarn", "pnpm"] as const;

export type SupportedPackageManager = (typeof supportedPackageManagers)[number];

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
export function getNodePackageManager(): SupportedPackageManager {
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
export async function installNodeModules(packageManager: SupportedPackageManager, opts?: Options) {
	const cwd = opts?.cwd ?? process.cwd();

	if (supportedPackageManagers.includes(packageManager)) {
		return await execa(packageManager, ["install"], {
			cwd,
		});
	}

	throw new Error("Failed to install modules, unsupported package manager");
}
