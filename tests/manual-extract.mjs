import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { PNG } from "pngjs";
import extract from "../index.mjs";
import convertSpriteDecodedBufferToPng from "../src/convertSpriteDecodedBufferToPng.mjs";
import decodePNG8 from "../src/decodePNG8.mjs";
import decodePCX from "../src/decodePCX.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buffer = readFileSync(`${__dirname}/files/arale-v1.sff`);
const metadata = extract(buffer, { sprites: false, palettes: false });
console.log(metadata);

const data = extract(buffer, {
  sprites: true,
  palettes: true,
  spriteGroups: [10302],
});
const sprite = data.sprites[0];
console.log(sprite);
const decoded = decodePCX(
  sprite.buffer,
  sprite.width,
  sprite.height,
  sprite.palette,
);
const png = convertSpriteDecodedBufferToPng(
  decoded,
  sprite.width,
  sprite.height,
);
writeFileSync("test.png", png);
