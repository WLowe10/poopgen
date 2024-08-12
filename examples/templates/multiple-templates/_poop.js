/*
This example represents a common scenario of having multiple templates (like create-vite). This makes a great example
of poopgen's before and after lifecycle functions.
*/

import {
	parseProjectName
} from "poopgen";
import * as p from "@clack/prompts";

/** @type{import("poopgen").BeforeFn}  */
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

	const { dir, name, packageName } = parseProjectName(result.name)

	/* this is providing a function that can be used inside of the ejs templates.
	 Normally, you should prepare the data and store it in ctx.data ready-to-go, but this is just demonstrating this capability */

	// @ts-ignore
	ctx.data.capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

	ctx.data.templateName = result.template;

	// packageName will be used in the package.json
	ctx.data.packageName = packageName;

	const template = ctx.dir.entries.find(entry => entry.path === result.template)

	// find and build the package.json
	const pkgJsonEntry = template.entries.find(entry => entry.path === "package.json");
	const pkg = JSON.parse(pkgJsonEntry.content);

	// set the name in the package.json
	pkg.name = packageName;

	// stringify and prettify the package.json
	pkgJsonEntry.content = JSON.stringify(pkg, null, 4)

	// overwrite the original poopgen entries for our selected template
	ctx.dir.entries = template.entries
}