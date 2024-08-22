import path from "node:path";
import fs from "node:fs/promises";
import ejs from "ejs";
import { parseDirectory, type DirectoryEntry, type FileEntry } from "./parse";
import { context } from "./context";

export type TemplateData = Record<string, any>;

export interface DirectoryContext {
	dir: DirectoryEntry;
	data: TemplateData;
}

export type BeforeFnArgs = DirectoryContext;
export type AfterFnArgs = DirectoryContext;

export type BeforeFn = (args: BeforeFnArgs) => void;
export type AfterFn = (args: AfterFnArgs) => void;

export interface PoopModule {
	before: BeforeFn;
	after: AfterFn;
}

async function loadPoopModule(path: string): Promise<PoopModule> {
	try {
		return await import(path);
	} catch (err: any) {
		throw new PoopgenError(`Failed to import poopfile at ${path}`, err);
	}
}

export declare namespace poopgen {
	interface Options {
		template?: string;
		dest?: string;
		data?: TemplateData;
	}
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

	let poopModule: PoopModule | undefined;

	if (ctx.dir.poopfile) {
		poopModule = await loadPoopModule(ctx.dir.poopfile);

		// poop lifecycle before
		if (typeof poopModule.before === "function") {
			await context.run(ctx, () => poopModule!.before(ctx));
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
		await context.run(ctx, () => poopModule!.after(ctx));
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
