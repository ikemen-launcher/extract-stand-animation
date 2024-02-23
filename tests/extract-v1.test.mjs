import test from "node:test";
import assert from "node:assert";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import extract from "../index.mjs";
import convertSpriteDecodedBufferToPng from "../src/convertSpriteDecodedBufferToPng.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test("Extract v1 metadata", () => {
  const buffer = readFileSync(`${__dirname}/files/cvsryu-v1.sff`);
  const data = extract(buffer, { sprites: false, palettes: false });

  assert.strictEqual(data.version, "1.0.1.0");
});

test("Extract v1 sprite", () => {
  const buffer = readFileSync(`${__dirname}/files/cvsryu-v1.sff`);
  const data = extract(buffer, {
    palettes: true,
    paletteBuffer: false,
    paletteTable: true,
    spriteBuffer: false,
    decodeSpriteBuffer: true,
    spriteGroups: [0],
  });
  const sprite = data.sprites[0];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v1-sprite-001_test.png`, spritePng);
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v1-sprite-001.png`,
  );
  assert.strictEqual(Buffer.compare(expectedSpritePng, spritePng), 0);
});
