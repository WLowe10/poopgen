import * as p from "@clack/prompts";

/** @type{import("poopgen").BeforeFn}  */
export async function before(ctx) {
	const result = await p.group({
		name: () =>
			p.text({
				message: "What is your name",
			}),
		favoriteColor: () =>
			p.text({
				message: "What is your favorite color?",
			}),
	});

	// we can use Object.assign to easily add data to the template data
	Object.assign(ctx.data, result);
}
