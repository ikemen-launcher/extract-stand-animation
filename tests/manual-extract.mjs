import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { PNG } from "pngjs";
import extract from "../index.mjs";
import convertSpriteDecodedBufferToPng from "../src/convertSpriteDecodedBufferToPng.mjs";
import decodePNG8 from "../src/decodePNG8.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buffer = readFileSync(`${__dirname}/files/kim-v2.sff`);
const metadata = extract(buffer, { sprites: false, palettes: false });
console.log(metadata);

const data = extract(buffer, {
  sprites: true,
  palettes: true,
  spriteGroups: [0],
});
const sprite = data.sprites[0];
const palette = data.palettes[sprite.paletteIndex];
console.log(palette);
console.log(sprite);
const decoded = decodePNG8(
  sprite.buffer,
  sprite.width,
  sprite.height,
  palette.buffer,
);
const png = convertSpriteDecodedBufferToPng(
  decoded,
  sprite.width,
  sprite.height,
);
writeFileSync("test.png", png);
