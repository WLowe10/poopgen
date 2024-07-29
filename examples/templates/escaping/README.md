# Escaping

Poopgen can escape your files or directories if they contain a character that may collide with poopgen's mechanisms.

## How to escape

Wrap your folder or file name in `[]`

Note: if for some reason you need a file or directory that's name is surrounded by `[]`, you would then escape those braces.

```
ex: [test.ts] -> test.ts
ex: [.gitignore] -> .gitignore
ex: [[id]] -> [id]
```

## Gitignore is ignored by NPM

.gitignore is usually a file you should escape. The NPM registry will automatically ignore .gitignore from your "files" unless explicitly defined.
