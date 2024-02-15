import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import extract from "../index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buffer = readFileSync(`${__dirname}/files/kfm-v2.sff`);
const data = extract(buffer, { palettes: false, spriteBuffer: false });

for (const sprite of data.sprites) {
  console.log(sprite);
}