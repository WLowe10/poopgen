import { AsyncLocalStorage } from "node:async_hooks";
import type { DirectoryContext } from "./poopgen";

export const context = new AsyncLocalStorage<DirectoryContext>();

export function getCtx() {
	const ctx = context.getStore();

	if (!ctx) {
		throw new Error("getCtx can only be used within a poopfile (_poop.js)");
	}

	return ctx;
}
