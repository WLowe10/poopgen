/** @type{import("poopgen").BeforeFn}  */
export function before(ctx) {
	console.log("began generating!");

	ctx.data.name = "poopgen";
}

/** @type{import("poopgen").AfterFn}  */
export function after(ctx) {
	console.log("done generating!");
}
