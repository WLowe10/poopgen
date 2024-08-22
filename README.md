# poopgen 💩

Simple and flexible project generator.

With poopgen, your project generation logic lives inside of your template.

### Why is it named poopgen?

Project generators emit files and I thought poopgen was a fitting name :)

## Table Of Contents

-   [Install](#install)
-   [Usage](#usage)
-   [A Basic Example](#a-basic-example)
-   [More examples](/examples/templates)

## Install

```sh
npm i poopgen
# or
yarn add poopgen
# or
pnpm add poopgen
```

## Usage

```ts
import { poopgen } from "poopgen";

await poopgen({
	// tell poopgen where your template lives
	template: "./template",
	// tell poopgen where to build your project to
	dest: "./dest",
});
```

## A Basic Example

> This should be all you need to learn how to use poopgen. It's that easy to use!

A poopgen template is a folder that contains three things:

-   Files
-   Other folders
-   poopfiles

For the following example, we will assume that this is the file tree for our generator:

```
src/
├─ cli.ts
template/
├─ _poop.js
├─ index.ts.ejs
├─ README.md

```

### `src/cli.ts`

```ts
import { poopgen } from "poopgen";

await poopgen({
	// tell poopgen where your template lives
	template: "./template",
	// tell poopgen where to build your project to
	dest: "./dest",
});
```

### `template/\_poop.js`

This is what poopgen recognizes as a `poopfile`. A poopfile is any simple JavaScript module named `_poop.js` that exports functions named `before` and `after`. (You can export `before`, `after`, or both!)

_This allows you to embed logic and hook into the poopgen lifecycle directly within your template!_

Poopfiles can live in any directory inside of your template. _They are not included in your output._

The `before` function is executed before poopgen generates the directory
The `after` function is executed after poopgen generates the directory

> It just makes sense, right?

Here are some of the things you could use them for:

-   ask the user for input
-   Install dependencies or create a git repository after the project has been generated
-   skipping a directory if a condition is not met
    -   maybe a user doesn't want to opt in to a certain feature

```js
/** @type{import("poopgen").BeforeFn}  */
export async function before(ctx) {
	// the 'before' function is called before the current directory is generated
	console.log("before generating!");

	// IMPORTANT
	// ctx.data is the data used for rendering ejs templates
	ctx.data.name = "poopgen";

	// you could use this to collect information from the user to be used in your templates!
}

/** @type{import("poopgen").AfterFn}  */
export function after(ctx) {
	// the 'after' function is called after the current directory is generated

	console.log("done generating!");
}
```

### `template/index.ts.ejs`

```js
/* 
poopgen uses ejs to render templates. If a file ends with .ejs, poopgen knows it is a template and will strip the extension off after generating it. 

Note: If a file does not end with .ejs, it is copied to the destination without any templating

Remember how we defined ctx.data.name in this directory's poopfile? ('_poop.js'). This file, 'index.ts.ejs', requires name to be defined on the ctx.data object.
*/

console.log("Hello world from <%- name %>!");
```

### `template/README.md`

```md
# Example

This file does not end in '.ejs', it will be copied to '/dest/README.md'!
```

### Time to Generate

Our template is ready to be generated! After running ./src/cli.ts, poopgen should have pooped a directory called `dest` in your working directory.

```
dest/
├─ index.ts
├─ README.md
```

### `dest/index.ts`

> See, I told you that poopgen would remove the .ejs extension!

```ts
console.log("Hello world from poopgen!");
```

## Extra

### getCtx

Poopgen exports a function named `getCtx` that allows you to access the current context inside of a poopfile.

```js
import { getCtx } from "poopgen";

// so this...
export function before() {
	const ctx = getCtx();

	ctx.data.message = "poopgen is awesome!";
}

// achieves the same as this
export function before(ctx) {
	ctx.data.message = "poopgen is awesome!";
}

// use getCtx whenever it makes sense to you!
```

Context is useful if you want to create helper functions, but don't necessarily want to have to pass the context to all of them.

```js
import { getCtx } from "poopgen";

export function before() {
	printTemplateData();
}

export function after() {
	printDestPath();
}

// logs the inside of ctx.data (ctx.data is used to render the ejs templates)
function printTemplateData() {
	const ctx = getCtx();

	console.log("rendering template files with", ctx.data);
}

// logs the destination of the generation
function printDestinationPath() {
	const ctx = getCtx();

	console.log("project was generated to", ctx.dir.path);
}
```

## Built with poopgen

### [ts-lib-gen](https://github.com/WLowe10/ts-lib-gen)

A simple generator to create a new typescript library
