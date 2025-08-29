export class PoopgenError extends Error {
	constructor(message: string) {
		super(message);

		this.name = "PoopgenError";
	}
}
