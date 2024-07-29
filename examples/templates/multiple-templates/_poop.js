/*
This example represents a common scenario of having multiple templates (create-vite). This makes a great example
of poopgen's before and after lifecycle functions.

Notes:
	- We are using @clack/prompts for promptinh
	- The user can choose to create an Express, Fastify, or Hono app
	- The user can choose to install modules and initialize a git repo at the end.
	  Poopgen has these utilities built in since they are so common.
*/

import {
	toValidNodePackageName,
	getNodePackageManager,
	installNodeModules,
	initGit,
} from "../../../dist/utils";
import ora from 'ora';
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import * as p from "@clack/prompts";

/** @type{import("../../../src/index").BeforeFn}  */
export async function before(ctx) {
	p.intro("create-my-app")

	const result = await p.group(
		{
			name: () =>
				p.text({
					message: "Project name",
				}),
			template: () =>
				p.select({
					message: "Select a template",
					options: [
						{
							value: "express",
							label: "Express",
						},
						{
							value: "fastify",
							label: "Fastify",
						},
						{
							value: "hono",
							label: "Hono",
						},
					],
				}),
		},
		{
			onCancel: () => {
				process.exit(0);
			},
		}
	);

	const projectDir = path.join(ctx.destPath, result.name);
	const projectName = path.basename(projectDir);
	const packageName = toValidNodePackageName(projectName);

	const templateDir = "_" + result.template;

	if (fs.existsSync(projectDir)) {
		if (fs.readdirSync(projectDir).length > 0) {
			const recoveryOption = await p.select({
				message: `${chalk.redBright.bold("Warning:")} ${chalk.cyan.bold("this project already exists. How would you like to proceed?")}`,
				options: [
					{
						label: "Abort installation",
						value: "abort",
						hint: "recommended"
					},
					{
						label: "Clear the directory and continue installation",
						value: "clear",
					},
					{
						label: "Continue installation and overwrite conflicting files",
						value: "overwrite",
					},
				],
			});

			if (recoveryOption === "abort") {
				process.exit(0);
			} else if (recoveryOption === "clear") {
				fs.emptyDirSync(projectDir);
			}
		}
	}

	/* this is providing a function that can be used inside of the ejs templates.
	 Normally, you should prepare the data and store it in ctx.data ready-to-go, but this is just demonstrating this capability */
	ctx.data.capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

	ctx.data.templateName = result.template;

	// packageName will be used in the package.json
	ctx.data.packageName = packageName;

	// change poopgen's destination dir
	ctx.destPath = projectDir;

	// tell poopgen to use the template dir the user chose
	// note: we are doing this since we are telling poopgen where to generate next
	/* note: our gitignore and README are shared between the templates so we will include them here in the entries 
		most of the time, files like these are project specific, but since this example is simple, they are all the same*/
	ctx.entries = [templateDir, "[.gitignore]", "README.md.ejs"];
}

/** @type{import("../../../src/index").BeforeFn}  */
export async function after(ctx) {
	// at this point, poopgen is done with generating the files for the project.
	// this is where you may ask the user if they want to initialize a git repo or install node modules
	// it can also be used to provide an outro or present next steps to the user

	const packageManager = getNodePackageManager();

	const group = await p.group({
		shouldInitGit: () =>
			p.confirm({
				message: "Initialize Git repo?",
			}),
		shouldInstallDependencies: () =>
			p.confirm({
				message: `Install dependencies with ${packageManager}?`,
			}),
	});

	// initialize git repo
	if (group.shouldInitGit) {
		const spinner = ora("Initializing new git repo...\n").start();

		// check if is in repo
		// check if .git exists in the dest dir

		await initGit({
			cwd: ctx.destPath,
		});
	}

	// install node modules
	if (group.shouldInstallDependencies) {
		await installNodeModules(packageManager, {
			cwd: ctx.destPath,
		});
	}

	// log next steps
	console.log(`cd ${path.relative(process.cwd(), ctx.destPath)}`);

	if (!group.shouldInstall) {
		console.log(`${packageManager} install`);
	}
}
