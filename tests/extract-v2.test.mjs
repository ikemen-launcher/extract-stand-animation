import test from "node:test";
import assert from "node:assert";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import extract from "../index.mjs";
import convertSpriteDecodedBufferToPng from "../src/convertSpriteDecodedBufferToPng.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test("Extract v2 metadata", () => {
  const buffer = readFileSync(`${__dirname}/files/kfm-v2.sff`);
  const data = extract(buffer, { sprites: false, palettes: false });

  assert.strictEqual(data.version, "2.0.1.0");
});

test("Extract v2 sprite RLE8", () => {
  const buffer = readFileSync(`${__dirname}/files/kfm-v2.sff`);
  const data = extract(buffer, {
    palettes: false,
    spriteBuffer: false,
    decodeSpriteBuffer: true,
    spriteGroups: [9000],
  });

  // group 9000, number 1
  const sprite = data.sprites[1];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v2-sprite-001_test.png`, spritePng);
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v2-sprite-001.png`,
  );
  assert.strictEqual(Buffer.compare(expectedSpritePng, spritePng), 0);
});

test("Extract v2 sprite LZ5", () => {
  const buffer = readFileSync(`${__dirname}/files/kfm-v2.sff`);
  const data = extract(buffer, {
    palettes: false,
    spriteBuffer: false,
    decodeSpriteBuffer: true,
    spriteGroups: [0],
  });

  // group 0, number 0
  const sprite = data.sprites[0];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v2-sprite-002_test.png`, spritePng);
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v2-sprite-002.png`,
  );
  assert.ok(spritePng.equals(expectedSpritePng));
});

test("Extract v2 sprite PNG8", () => {
  const buffer = readFileSync(`${__dirname}/files/batman-v2.sff`);
  const data = extract(buffer, {
    palettes: false,
    spriteBuffer: false,
    decodeSpriteBuffer: true,
    spriteGroups: [9000],
  });

  // group 9000, number 0
  const sprite = data.sprites[0];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v2-sprite-003_test.png`, spritePng);
  /*
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v2-sprite-003.png`,
  );
  assert.ok(spritePng.equals(expectedSpritePng));
  */
});

test("Extract v2 sprite PNG24", () => {
  const buffer = readFileSync(`${__dirname}/files/ruby-v2.sff`);
  const data = extract(buffer, {
    palettes: false,
    spriteBuffer: false,
    decodeSpriteBuffer: true,
    spriteGroups: [6053],
  });

  // group 6053, number 0
  const sprite = data.sprites[0];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v2-sprite-004_test.png`, spritePng);
  /*
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v2-sprite-004.png`,
  );
  assert.ok(spritePng.equals(expectedSpritePng));
  */
});

test("Extract v2 sprite PNG32", () => {
  const buffer = readFileSync(`${__dirname}/files/batman-v2.sff`);
  const data = extract(buffer, {
    palettes: false,
    spriteBuffer: false,
    decodeSpriteBuffer: true,
    spriteGroups: [9000],
  });

  // group 9000, number 45
  const sprite = data.sprites[2];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v2-sprite-005_test.png`, spritePng);
  /*
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v2-sprite-005.png`,
  );
  assert.ok(spritePng.equals(expectedSpritePng));
  */
});

test("Extract v2 sprite length 0 (copy of the first sprite)", () => {
  const buffer = readFileSync(`${__dirname}/files/piccolo-v2.sff`);
  const data = extract(buffer, {
    palettes: false,
    spriteBuffer: true,
    decodeSpriteBuffer: true,
    spriteGroups: [186],
  });

  // group 186, number 0
  const sprite = data.sprites[0];
  const spritePng = convertSpriteDecodedBufferToPng(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
  );
  writeFileSync(`${__dirname}/sprites/v2-sprite-006_test.png`, spritePng);
  const expectedSpritePng = readFileSync(
    `${__dirname}/sprites/v2-sprite-006.png`,
  );
  assert.ok(spritePng.equals(expectedSpritePng));
});
