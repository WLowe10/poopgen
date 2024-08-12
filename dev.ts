import { poopgen } from "./src";
import chalk from "chalk";

try {
	await poopgen({
		template: "./examples/templates/escaping",
		dest: "./dest",
	});
} catch (err) {
	console.log(chalk.red("An unknown error has occurred"));
	console.log(err);
}

process.exit(0);
