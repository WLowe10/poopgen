import path from "path";
import fs from "fs/promises";
import ejs from "ejs";

export type TemplateData = Record<string, any>;

export type FileEntry = {
	type: "file";
	content: string;
	from: string;
	to: string;
	isTemplate: boolean;
};

export type DirectoryEntry = {
	type: "directory";
	content: Entry[];
	from: string;
	to: string;
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

export async function parseDirectory(
	templatePath: string,
	destPath: string
): Promise<DirectoryEntry> {
	const entities = await fs.readdir(templatePath, { withFileTypes: true });
	const poopfileIdx = entities.findIndex((e) => e.isFile() && e.name === "_poop.js");

	let poopfile;

	if (poopfileIdx > -1) {
		const poopfileEntity = entities[poopfileIdx];

		poopfile = path.join(templatePath, poopfileEntity.name);

		// remove the poopfile from the entities so we don't accidentally generate it
		entities.splice(poopfileIdx, 1);
	}

	const content: Entry[] = [];

	for (const entity of entities) {
		const entityPath = path.join(templatePath, entity.name);

		let entityDestPath;

		if (entity.name.startsWith("[") && entity.name.endsWith("]")) {
			// this entity is escaped, remove the brackets from the dest path
			entityDestPath = path.join(destPath, entity.name.slice(1, -1));
		} else {
			entityDestPath = path.join(destPath, entity.name);
		}

		if (entity.isDirectory()) {
			content.push(await parseDirectory(entityPath, entityDestPath));
		} else {
			if (entity.name.endsWith(".ejs")) {
				// remove the .ejs from the file extension
				entityDestPath = entityDestPath.substring(0, entityDestPath.length - 4);

				entityDestPath = content.push({
					type: "file",
					content: await fs.readFile(entityPath, "utf8"),
					from: entityPath,
					to: entityDestPath,
					isTemplate: true,
				});
			} else {
				content.push({
					type: "file",
					content: await fs.readFile(entityPath, "utf8"),
					from: entityPath,
					to: entityDestPath,
					isTemplate: false,
				});
			}
		}
	}

	return {
		type: "directory",
		from: templatePath,
		to: destPath,
		content,
		poopfile,
	};
}

async function processDirectoryEntry(dir: DirectoryEntry, data: TemplateData) {
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

	if (dir.content.length) {
		// ensure that the directory exists before generating the files
		await fs.mkdir(dir.to, { recursive: true });

		// process the non poopfile files
		for (const entry of dir.content) {
			if (entry.type === "directory") {
				await processDirectoryEntry(entry, data);
			} else {
				await processFileEntry(entry, data);
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

async function processFileEntry(entry: FileEntry, data: TemplateData) {
	let content = entry.content;

	// if the file ends with .ejs, render the template
	if (entry.isTemplate) {
		content = ejs.render(entry.content, data);
	}

	// write the file stripped of the .ejs extension
	await fs.writeFile(entry.to, content);
}

export async function poopgen(opts?: poopgen.Options) {
	const baseTemplatePath = path.resolve(opts?.templateDir ?? "/template");
	const baseDestPath = opts?.destDir ? path.resolve(opts.destDir) : process.cwd();
	const data = opts?.data ?? {};

	const template = await parseDirectory(baseTemplatePath, baseDestPath);

	await processDirectoryEntry(template, data);
}
