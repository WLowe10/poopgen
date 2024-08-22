/** @type{import("poopgen").BeforeFn}  */
export async function before(ctx) {
	console.log("before generating!")

	ctx.data.name = "poopgen"
}

/** @type{import("poopgen").AfterFn}  */
export function after(ctx) {
	console.log("done generating!");
}
