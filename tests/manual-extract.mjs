import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import extract from "../index.mjs";
import convertSpriteDecodedBufferToPng from "../src/convertSpriteDecodedBufferToPng.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buffer = readFileSync(`${__dirname}/files/greenarrow-v1.sff`);
const metadata = extract(buffer, { sprites: false, palettes: false });
console.log(metadata);

const data = extract(buffer, { sprites: true, palettes: true });
