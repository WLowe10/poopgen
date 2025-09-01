# Examples

All of these examples are poopgen template directories. Here is how you may use poopgen to generate one of these examples.

```typescript
import { poopgen } from "poopgen";

await poopgen({
	templatePath: "./examples/basic",
	destPath: "./dest",
});
```

- [Basic](/basic)
- [Escaping](/escaping)
- [JSON](/json)
- [Multiple Templates](/multiple-templates)
