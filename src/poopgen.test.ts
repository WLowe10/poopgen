import { vi, it, expect, beforeEach } from "vitest";
import { fs, vol } from "memfs";
import { poopgen } from "./poopgen";

vi.mock("node:fs", async () => {
	const { fs } = await import("memfs");

	return {
		default: fs,
	};
});

vi.mock("node:fs/promises", async () => {
	const { fs } = await import("memfs");

	return {
		default: fs.promises,
	};
});

beforeEach(() => {
	vol.reset();
});

it("escaped files are correctly generated", async () => {
	vol.fromJSON({
		"/template/[package.json]": "{}",
	});

	await poopgen({
		templatePath: "/template",
		destPath: "/dest",
	});

	expect(fs.readFileSync("/dest/package.json", "utf8")).toBe("{}");
});

it("correctly generates with a template file", async () => {
	vol.fromJSON({
		"/template/index.ts.ejs": "console.log('<%= message %>')",
	});

	await poopgen({
		templatePath: "/template",
		destPath: "/dest",
		data: {
			message: "Hello world!",
		},
	});

	expect(fs.readFileSync("/dest/index.ts", "utf8")).toBe("console.log('Hello world!')");
});
