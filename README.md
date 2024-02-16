# SFF Extractor

Extract information and images contained in a SFF file (Elecbyte format).

## Options

| Option             | Description                           | Type    | Default value |
| ------------------ | ------------------------------------- | ------- | ------------- |
| palettes           | Includes palettes                     | Boolean | `true`        |
| paletteBuffer      | Includes buffer of each palette       | Boolean | `true`        |
| paletteTable       | Includes colors table of each palette | Boolean | `true`        |
| sprites            | Includes sprites                      | Boolean | `true`        |
| spriteBuffer       | Includes buffer of each sprite        | Boolean | `true`        |
| decodeSpriteBuffer | Decode buffer of each sprite          | Boolean | `false`       |
| spriteGroup        | Filter sprites by group               | String  | `""`          |

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
