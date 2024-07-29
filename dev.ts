import { poopgen } from "./src";
import chalk from "chalk";

try {
	await poopgen({
		templateDir: "./examples/templates/multiple-templates",
		destDir: "./dest",
	});
} catch (err) {
	console.log(chalk.red("An unknown error has occurred"));
	console.log(err);
}

process.exit(0);
