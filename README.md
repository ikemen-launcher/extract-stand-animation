# SFF Extractor

Extract information and images contained in a SFF file (Elecbyte format).

## Options

| Option   | Description       | Type    | Default value |
| -------- | ----------------- | ------- | ------------- |
| sprites  | Includes sprites  | Boolean | `true`        |
| palettes | Includes palettes | Boolean | `true`        |

## Examples

Extract everything:

```js
import { readFileSync } from "node:fs";
import extract from "sff-extractor";

const buffer = readFileSync("kfm.sff");
const data = extract(buffer);

console.log(data);
```

Extract only global metadata:

```js
const options = {
  sprites: false,
  palettes: false,
};
const data = extract(buffer, options);
```
