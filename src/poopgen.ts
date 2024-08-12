import path from "path";
import fs from "fs/promises";
import ejs from "ejs";
import { parseDirectory, type DirectoryEntry, type FileEntry } from "./parse";

export type TemplateData = Record<string, any>;

export type DirectoryContext = {
	dir: DirectoryEntry;
	data: TemplateData;
};

export type BeforeFn = (ctx: DirectoryContext) => void;
export type AfterFn = (ctx: DirectoryContext) => void;

export interface PoopModule {
	before: BeforeFn;
	after: AfterFn;
}

async function loadPoopModule(path: string): Promise<PoopModule> {
	try {
		return await import(path);
	} catch (err) {
		throw new Error(`Failed to import poopfile at ${path}`);
	}
}

export declare namespace poopgen {
	type Options = {
		template?: string;
		dest?: string;
		data?: TemplateData;
	};
}

export class PoopgenError extends Error {
	constructor(message: string, cause?: Error) {
		super(message);

		this.cause = cause;
	}
}

async function processDirectoryEntry(dir: DirectoryEntry, data: TemplateData, parentDest: string) {
	const ctx: DirectoryContext = {
		data,
		dir,
	};

	// make the dir path absolute before entering the lifecycle
	ctx.dir.path = path.resolve(parentDest, ctx.dir.path);

	let poopModule;

	if (ctx.dir.poopfile) {
		poopModule = await loadPoopModule(ctx.dir.poopfile);

		// poop lifecycle before
		if (typeof poopModule.before === "function") {
			await poopModule.before(ctx);

			// ensure we resolve the path again if the user changes the path in the lifecycle
			ctx.dir.path = path.resolve(parentDest, ctx.dir.path);
		}
	}

	if (ctx.dir.entries.length) {
		// ensure that the directory exists before generating the files
		await fs.mkdir(ctx.dir.path, { recursive: true });

		// process the contents of the directory
		for (const entry of ctx.dir.entries) {
			if (entry.type === "directory") {
				await processDirectoryEntry(entry, data, ctx.dir.path);
			} else {
				await processFileEntry(entry, data, ctx.dir.path);
			}
		}
	}

	// poop lifecycle after
	if (poopModule && typeof poopModule.after === "function") {
		await poopModule.after(ctx);
	}
}

async function processFileEntry(file: FileEntry, data: TemplateData, parentDest: string) {
	let content = file.content;

	// if the file is a template, render it
	if (file.isTemplate) {
		content = ejs.render(file.content, data);
	}

	await fs.writeFile(path.resolve(parentDest, file.path), content);
}

export async function poopgen(opts?: poopgen.Options) {
	const baseTemplatePath = path.resolve(opts?.template ?? "/template");
	const baseDestPath = opts?.dest ? path.resolve(opts.dest) : process.cwd();
	const data = opts?.data ?? {};

	const template = await parseDirectory(baseTemplatePath);

	// strip the name of the root template directory
	template.path = "";

	// console.log(JSON.stringify(template, null, 2));

	await processDirectoryEntry(template, data, baseDestPath);
}
