/** @type{import("poopgen").BeforeFn}  */
export function before(ctx) {
	const packageJSONEntry = ctx.entry.content.find(entry => entry.type === "file" && entry.from.endsWith("package.json"));

	if (packageJSONEntry) {
		const pkg = JSON.parse(packageJSONEntry.content);

		pkg.name = "typescript-types"
		pkg.keywords = ["typescript", "types", "utils"];

		packageJSONEntry.content = JSON.stringify(pkg, null, 4);
	}
}
