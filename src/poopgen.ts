import path from "node:path";
import fs from "node:fs/promises";
import ejs from "ejs";
import { parseDirectory, type DirectoryEntry, type FileEntry } from "./parse";
import { PoopgenError } from "./error";

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

// process file

async function processFileEntry(file: FileEntry, data: TemplateData, parentDest: string) {
	let content = file.content;

	// if the file is a template, render it
	if (file.isTemplate) {
		content = ejs.render(file.content, data);
	}

	await fs.writeFile(path.resolve(parentDest, file.path), content);
}

export class PoopfileImportError extends PoopgenError {
	public path: string;

	constructor(path: string, cause?: unknown) {
		super(`Failed to import poopfile at ${path}`);

		this.path = path;
		this.cause = cause;
		this.name = "PoopfileImportError";
	}
}

// process directory

async function processDirectoryEntry(dir: DirectoryEntry, data: TemplateData, parentDest: string) {
	const ctx: DirectoryContext = {
		data,
		dir,
	};

	// make the dir path absolute before entering the lifecycle
	ctx.dir.path = path.resolve(parentDest, ctx.dir.path);

	let poopModule: PoopModule | undefined;

	if (ctx.dir.poopfile) {
		try {
			poopModule = (await import(ctx.dir.poopfile)) as PoopModule;
		} catch (err: any) {
			throw new PoopfileImportError(ctx.dir.poopfile, err);
		}

		// poop lifecycle before
		if (typeof poopModule.before === "function") {
			await poopModule.before(ctx);
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

export declare namespace poopgen {
	interface Options {
		/**
		 * The path to the template directory.
		 *
		 * Can be relative or absolute.
		 */
		templatePath: string;

		/**
		 * The path where the generated template will be written
		 *
		 * Can be relative or absolute.
		 */
		destPath: string;

		/**
		 * An object containing data for rendering template files
		 */
		data?: TemplateData;
	}
}

export async function poopgen(opts: poopgen.Options) {
	const templatePath = path.resolve(opts.templatePath);
	const destPath = path.resolve(opts.destPath);
	const data = opts?.data ?? {};

	const template = await parseDirectory(templatePath);

	// strip the name of the root template directory
	template.path = "";

	await processDirectoryEntry(template, data, destPath);
}
