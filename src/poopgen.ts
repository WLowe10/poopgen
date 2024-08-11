import path from "path";
import fs from "fs/promises";
import ejs from "ejs";

export type TemplateData = Record<string, any>;

export type FileEntry = {
	type: "file";
	path: string;
	content: string;
	isTemplate?: boolean;
};

export type DirectoryEntry = {
	type: "directory";
	path: string;
	content: Entry[];
	poopfile?: string;
};

export type Entry = FileEntry | DirectoryEntry;

export type DirectoryContext = {
	data: TemplateData;
	templatePath: string;
	entries: Entry[];
};

export type BeforeFn = (ctx: { entry: DirectoryEntry; data: TemplateData }) => void;
export type AfterFn = (ctx: { entry: DirectoryEntry; data: TemplateData }) => void;

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
		templateDir?: string;
		data?: TemplateData;
		destDir?: string;
		jsonSpace?: string | number;
	};
}

export class PoopgenError extends Error {
	constructor(message: string, cause?: Error) {
		super(message);

		this.cause = cause;
	}
}

export async function parseDirectory(templatePath: string): Promise<DirectoryEntry> {
	const entities = await fs.readdir(templatePath, { withFileTypes: true });
	const poopfileIdx = entities.findIndex((e) => e.isFile() && e.name === "_poop.js");

	let poopfile;

	if (poopfileIdx > -1) {
		poopfile = path.join(templatePath, "_poop.js");

		// remove the poopfile from the entities so we don't accidentally generate it
		entities.splice(poopfileIdx, 1);
	}

	const content: Entry[] = [];

	for (const entity of entities) {
		let entityName = entity.name;

		const entityPath = path.join(templatePath, entity.name);

		if (entityName.startsWith("[") && entityName.endsWith("]")) {
			// this entity is escaped, remove the brackets from the dest path
			entity.name.slice(1, -1);
		}

		if (entity.isDirectory()) {
			content.push(await parseDirectory(entityPath));
		} else {
			if (entity.name.endsWith(".ejs")) {
				// remove the .ejs from the file extension
				entityName = entityName.substring(0, entityName.length - 4);

				content.push({
					type: "file",
					content: await fs.readFile(entityPath, "utf8"),
					path: entityName,
					isTemplate: true,
				});
			} else {
				content.push({
					type: "file",
					content: await fs.readFile(entityPath, "utf8"),
					path: entityName,
					isTemplate: false,
				});
			}
		}
	}

	return {
		type: "directory",
		path: "",
		content,
		poopfile,
	};
}

async function processDirectoryEntry(dir: DirectoryEntry, data: TemplateData, destPath: string) {
	let poopModule;

	if (dir.poopfile) {
		poopModule = await loadPoopModule(dir.poopfile);

		// poop lifecycle before
		if (typeof poopModule.before === "function") {
			await poopModule.before({
				data,
				entry: dir,
			});
		}
	}

	const entityDestPath = path.resolve(destPath, dir.path);

	if (dir.content.length) {
		// ensure that the directory exists before generating the files
		await fs.mkdir(entityDestPath, { recursive: true });

		// process the non poopfile files
		for (const entry of dir.content) {
			if (entry.type === "directory") {
				await processDirectoryEntry(entry, data, entityDestPath);
			} else {
				await processFileEntry(entry, data, entityDestPath);
			}
		}
	}

	// poop lifecycle after
	if (poopModule && typeof poopModule.after === "function") {
		await poopModule.after({
			data,
			entry: dir,
		});
	}
}

async function processFileEntry(file: FileEntry, data: TemplateData, destPath: string) {
	const entityDestPath = path.resolve(destPath, file.path);

	let content = file.content;

	if (file.isTemplate) {
		// if the file is a template, render it
		content = ejs.render(file.content, data);
	}

	await fs.writeFile(entityDestPath, content);
}

export async function poopgen(opts?: poopgen.Options) {
	const baseTemplatePath = path.resolve(opts?.templateDir ?? "/template");
	const baseDestPath = opts?.destDir ? path.resolve(opts.destDir) : process.cwd();
	const data = opts?.data ?? {};

	const template = await parseDirectory(baseTemplatePath);

	await processDirectoryEntry(template, data, baseDestPath);
}
