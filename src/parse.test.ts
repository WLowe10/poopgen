import { vi, beforeEach, it, expect } from "vitest";
import { vol } from "memfs";
import { parseDirectory } from "./parse";

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

it("can parse a template using all features", async () => {
	vol.fromJSON({
		"/template/test.txt": "test",
		"/template/test2.txt.ejs": "test",
		"/template/[package.json]": "escaped",
		"/template/_poop.js": "export async function before() {}",
		"/template/nested/nested.txt": "nested",
	});

	const entries = await parseDirectory("/template");

	expect(entries).toMatchSnapshot();
});
