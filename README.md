# poopgen

> Simple and flexible project generator

## Why is it named poopgen?

Project generators emit files and I thought poopgen was a cute name.

## Install

```sh
npm i poopgen
# or
yarn add poopgen
# or
pnpm add poopgen
```

## Usage

```typescript
// index.ts

import { poopgen } from "poopgen";

await poopgen({
	// tell poopgen where your template lives
	templateDir: "./template",
	// tell poopgen where to build your project to
	destDir: "./dest",
});
```

## Templates

Poopgen uses a really simple and flexible templating system (with some cool tricks too)

### Basics

A poopgen template is a folder that contains three things:

-   Files
-   Other folders
-   poopfiles

You may be wondering: `what is a poopfile?`

### poopfiles

A poopfile is a file named `_poop.js` that allows you to embed logic during generating a project. A poopfile is a simple JavaScript module that exports two functions.

```javascript
export function before(ctx) {
	// this runs before the contents are generated
}

export function after(ctx) {
	// this runs after the contents are generated
}
```
