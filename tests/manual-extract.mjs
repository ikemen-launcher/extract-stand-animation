import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { PNG } from "pngjs";
import extract from "../index.mjs";
import convertSpriteDecodedBufferToPng from "../src/convertSpriteDecodedBufferToPng.mjs";
import convertPaletteRGBtoRGBA from "../src/convertPaletteRGBtoRGBA.mjs";
import decodePNG8 from "../src/decodePNG8.mjs";
import decodeRLE8 from "../src/decodeRLE8.mjs";
import decodePCX from "../src/decodePCX.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buffer = readFileSync(`${__dirname}/files/cyclops-v1.sff`);
const metadata = extract(buffer, { sprites: false, palettes: false });
console.log(metadata);

const data = extract(buffer, {
  sprites: true,
  palettes: true,
  //decodeSpriteBuffer: true,
  spriteGroups: [0],
});
const sprite = data.sprites[0];
console.log(sprite);
//process.exit(0);
/*
for (const palette of data.palettes) {
  console.log(palette);
}
process.exit(0);
//*/
/*
const palette = data.palettes[sprite.paletteIndex];
for (let i = 0; i < palette.buffer.length; i += 4) {
  console.log(`Index ${i/4} R ${palette.buffer[i]}, G ${palette.buffer[i+1]}, B ${palette.buffer[i+2]}, A ${palette.buffer[i+3]}`);
}
*/
//console.log(palette);
const externalPalette = readFileSync(
  `${__dirname}/files/cyclops-v1-palette1.act`,
);
const externalPaletteRGBA = convertPaletteRGBtoRGBA(externalPalette);
const external = Buffer.alloc(256 * 4);
for (
  let i = 0, j = 256 * 4 - 1;
  i < externalPaletteRGBA.length;
  i += 4, j -= 4
) {
  //console.log(`Index ${i / 4}`);
  //console.log(`  R ${sprite.palette[i]}, G ${sprite.palette[i + 1]}, B ${sprite.palette[i + 2]}, A ${sprite.palette[i + 3]}  =>  R ${externalPaletteRGBA[i]}, G ${externalPaletteRGBA[i+1]}, B ${externalPaletteRGBA[i+2]}, A ${externalPaletteRGBA[i+3]}`);
  const red = externalPaletteRGBA[i];
  const green = externalPaletteRGBA[i + 1];
  const blue = externalPaletteRGBA[i + 2];
  const alpha = externalPaletteRGBA[i + 3];

  external[j] = alpha;
  external[j - 1] = blue;
  external[j - 2] = green;
  external[j - 3] = red;
}

const decoded = decodePCX(
  sprite.buffer,
  sprite.width,
  sprite.height,
  //sprite.palette,
  //palette.buffer,
  external,
);
const png = convertSpriteDecodedBufferToPng(
  decoded,
  sprite.width,
  sprite.height,
);
writeFileSync("test.png", png);
