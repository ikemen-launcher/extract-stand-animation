import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import extract from "../index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buffer = readFileSync(`${__dirname}/files/kfm-v2.sff`);
const data = extract(buffer, { sprites: false, paletteBuffer: false });

for (const palette of data.palettes) {
  console.log(palette);
}
