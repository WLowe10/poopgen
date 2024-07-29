export class PoopgenError extends Error {
	constructor(message: string, cause: Error | unknown) {
		super(message);

		this.name = "PoopgenError";
		this.cause = cause;
	}
}
