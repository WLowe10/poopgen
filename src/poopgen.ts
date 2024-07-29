import path from "path";
import fs from "fs/promises";
import ejs from "ejs";
import { PoopgenError } from "./errors";

// todo consider the CWD functionality
// todo should the root folder template folder be ignored of special folders (_+-)
// todo could there be better err handling?
// todo consider adding error boundaries in poopfiles

export type TemplateData = Record<string, any>;

export interface DirectoryContext {
	data: TemplateData;
	templatePath: string;
	destPath: string;
	entries: string[];
}

export type BeforeFn = (
	ctx: DirectoryContext,
	actions: {
		skip: () => void;
	}
) => void;

export type AfterFn = (ctx: DirectoryContext) => void;

export interface PoopModule {
	before: BeforeFn;
	after: AfterFn;
}

const poopfileName = "_poop.js";

const readFile = (path: string) => fs.readFile(path, "utf8");

const prettifyJSONString = (jsonStr: string, space: string | number) =>
	JSON.stringify(JSON.parse(jsonStr), null, space);

async function loadPoopModule(path: string): Promise<PoopModule> {
	try {
		return await import(path);
	} catch (err) {
		throw new PoopgenError(`Failed to import poopfile at ${path}`, err);
	}
}

export type PoopgenOptions = {
	templateDir?: string;
	data?: TemplateData;
	destDir?: string;
	jsonSpace?: string | number;
};

export async function poopgen(opts?: PoopgenOptions) {
	const jsonSpace = opts?.jsonSpace ?? "\t";
	const baseTemplatePath = path.resolve(opts?.templateDir ?? "/template");
	const baseDestPath = opts?.destDir ? path.resolve(opts.destDir) : process.cwd();

	const initialContext: DirectoryContext = {
		data: opts?.data ?? {},
		entries: [],
		templatePath: baseTemplatePath,
		destPath: baseDestPath,
	} as const;

	async function generateFile(from: string, to: string, ctx: DirectoryContext) {
		const templateData = ctx.data;
		const destPathInfo = path.parse(to);

		// ensure the dest exists
		await fs.mkdir(destPathInfo.dir, { recursive: true });

		// if the file ends with .ejs, we know it is a templated file to generate
		if (from.endsWith(".ejs")) {
			const template = await readFile(from);

			// render the ejs template with ctx
			let content;

			try {
				content = ejs.render(template, templateData);
			} catch (err) {
				throw new PoopgenError("Failed to render ejs template", err);
			}

			// strip the .ejs extension from the file name
			const orignalFileName = to.substring(0, to.length - 4);

			if (orignalFileName.endsWith(".json")) {
				// we will automatically prettify templated json files
				await fs.writeFile(orignalFileName, prettifyJSONString(content, jsonSpace));
			} else {
				await fs.writeFile(orignalFileName, content);
			}
		} else {
			// no templating needed, just copy the file to the destination
			await fs.copyFile(from, to);
		}
	}

	async function processEntry(entryPath: string, ctx: DirectoryContext) {
		const templatePath = path.join(ctx.templatePath, entryPath);
		const stats = await fs.stat(templatePath);

		let destPath = path.join(ctx.destPath, entryPath);
		let isEscaped = false;

		// check if name is escaped
		if (entryPath.startsWith("[") && entryPath.endsWith("]")) {
			// remove the first and last char ("[","]") from the name
			destPath = path.join(ctx.destPath, entryPath.slice(1, -1));
			isEscaped = true;
		}

		if (stats.isDirectory()) {
			if (
				!isEscaped &&
				(entryPath.startsWith("_") ||
					entryPath.startsWith("+") ||
					entryPath.startsWith("-"))
			) {
				// remove the pathless directory path
				destPath = path.dirname(destPath);

				// poopgen logical sugars
				if (entryPath.startsWith("+") || entryPath.startsWith("-")) {
					const ctxName = entryPath.slice(1);
					const ctxVal = ctx.data[ctxName];

					if (
						(entryPath.startsWith("+") && !ctxVal) ||
						(entryPath.startsWith("-") && !!ctxVal)
					) {
						return;
					}
				}
			}

			await processDirectory(templatePath, destPath, ctx);
		} else {
			await generateFile(templatePath, destPath, ctx);
		}
	}

	async function processDirectory(templatePath: string, destPath: string, ctx: DirectoryContext) {
		const entries = await fs.readdir(templatePath);
		const poopfile = entries.find((entry) => entry === poopfileName);

		const remainingEntries = poopfile
			? entries.filter((entry) => entry !== poopfileName)
			: entries;

		// create a new context for this directory
		const dirCtx: DirectoryContext = {
			data: ctx.data,
			entries: remainingEntries,
			templatePath: templatePath,
			destPath: destPath,
		};

		let poopModule: PoopModule | undefined;

		if (poopfile) {
			const poopfilePath = path.join(dirCtx.templatePath, poopfile);
			const stats = await fs.stat(poopfilePath);

			if (stats.isFile()) {
				let skipped = false;

				poopModule = await loadPoopModule(poopfilePath);

				// poop lifecycle before
				if (typeof poopModule.before === "function") {
					await poopModule.before(dirCtx, {
						skip: () => {
							skipped = true;
						},
					});
				}

				/* poopfiles are able to cancel generation by calling the "skip" function.
				this effectively skips the directory the poopfile is located in */
				if (skipped) {
					return;
				}
			}
		}

		// process the non poopfile files
		for (const entry of dirCtx.entries) {
			await processEntry(entry, dirCtx);
		}

		// poop lifecycle after
		if (poopModule && typeof poopModule.after === "function") {
			await poopModule.after(dirCtx);
		}
	}

	await processDirectory(baseTemplatePath, baseDestPath, initialContext);
}
