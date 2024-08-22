import { defineConfig } from "tsup";

export default defineConfig({
	outDir: "dist",
	entry: ["./src/index.ts", "./src/utils/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	splitting: false,
});
