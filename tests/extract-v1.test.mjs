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
  assert.ok(spritePng.equals(expectedSpritePng));
});

test("Extract v1 last sprite", () => {
  const buffer = readFileSync(`${__dirname}/files/arale-v1.sff`);
  const data = extract(buffer, {
    palettes: true,
    paletteBuffer: false,
    paletteTable: true,
    spriteBuffer: false,
    decodeSpriteBuffer: true,
    spriteGroups: [10302],
  });
  const sprite = data.sprites[0];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v1-sprite-002_test.png`, spritePng);
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v1-sprite-002.png`,
  );
  assert.ok(spritePng.equals(expectedSpritePng));
});

test("Extract v1 sprite length 0 (copy of the previous sprite)", () => {
  const buffer = readFileSync(`${__dirname}/files/crab-v1.sff`);
  const data = extract(buffer, {
    palettes: true,
    paletteBuffer: false,
    paletteTable: true,
    spriteBuffer: false,
    decodeSpriteBuffer: true,
    spriteGroups: [0],
  });
  const sprite = data.sprites[75];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v1-sprite-003_test.png`, spritePng);
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v1-sprite-003.png`,
  );
  assert.ok(spritePng.equals(expectedSpritePng));
});

test("Extract v1 sprite index == linked index", () => {
  const buffer = readFileSync(`${__dirname}/files/greenarrow-v1.sff`);
  const data = extract(buffer, {
    palettes: true,
    paletteBuffer: false,
    paletteTable: true,
    spriteBuffer: false,
    decodeSpriteBuffer: true,
    spriteGroups: [5040],
  });

  // group 5040, number 20
  const sprite = data.sprites[2];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v1-sprite-004_test.png`, spritePng);
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v1-sprite-004.png`,
  );
  assert.ok(spritePng.equals(expectedSpritePng));
});

test("Extract v1 sprite linked index > current index", () => {
  const buffer = readFileSync(`${__dirname}/files/cvssakura-v1.sff`);
  const data = extract(buffer, {
    palettes: true,
    paletteBuffer: false,
    paletteTable: true,
    spriteBuffer: false,
    decodeSpriteBuffer: true,
    spriteGroups: [5072],
  });

  // group 5072, number 10
  const sprite = data.sprites[0];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v1-sprite-005_test.png`, spritePng);
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v1-sprite-005.png`,
  );
  assert.ok(spritePng.equals(expectedSpritePng));
});

test("Extract v1 invalid sprite size", () => {
  const buffer = readFileSync(`${__dirname}/files/vivi-v1.sff`);
  const data = extract(buffer, {
    palettes: true,
    paletteBuffer: false,
    paletteTable: true,
    spriteBuffer: false,
    decodeSpriteBuffer: true,
    spriteGroups: [10017],
  });

  // group 10017, number 7
  const sprite = data.sprites[7];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v1-sprite-006_test.png`, spritePng);
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v1-sprite-006.png`,
  );
  assert.ok(spritePng.equals(expectedSpritePng));
});
