import fs from "node:fs/promises";
import path from "node:path";

export type FileEntry = {
	type: "file";
	path: string;
	content: string;
	isTemplate?: boolean;
};

export type DirectoryEntry = {
	type: "directory";
	path: string;
	entries: Entry[];
	poopfile?: string;
};

export type Entry = FileEntry | DirectoryEntry;

export async function parseDirectory(templatePath: string): Promise<DirectoryEntry> {
	const entities = await fs.readdir(templatePath, { withFileTypes: true });
	const poopfileIdx = entities.findIndex((e) => e.isFile() && e.name === "_poop.js");

	let poopfile;

	if (poopfileIdx > -1) {
		poopfile = path.join(templatePath, "_poop.js");

		// remove the poopfile from the entities so we don't generate it
		entities.splice(poopfileIdx, 1);
	}

	const entries: Entry[] = [];

	for (const entity of entities) {
		let entityName = entity.name;

		const entityPath = path.join(templatePath, entity.name);

		if (entityName.startsWith("[") && entityName.endsWith("]")) {
			// this entity is escaped, remove the brackets from the path
			entityName = entityName.slice(1, -1);
		}

		if (entity.isDirectory()) {
			entries.push(await parseDirectory(entityPath));
		} else {
			if (entity.name.endsWith(".ejs")) {
				// remove the .ejs from the file extension
				entityName = entityName.substring(0, entityName.length - 4);

				entries.push({
					type: "file",
					content: await fs.readFile(entityPath, "utf8"),
					path: entityName,
					isTemplate: true,
				});
			} else {
				entries.push({
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
		path: path.basename(templatePath),
		entries,
		poopfile,
	};
}
