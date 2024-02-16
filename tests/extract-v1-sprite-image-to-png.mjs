import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { PNG } from "pngjs";
import extract from "../index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function saveAsPNG(image, width, height, outputPath) {
  const png = new PNG({ width: width, height: height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let index = (y * width + x) * 4;
      let red = image[index];
      let green = image[index + 1];
      let blue = image[index + 2];
      let alpha = image[index + 3];

      let pngIndex = (y * width + x) << 2;
      png.data[pngIndex] = red;
      png.data[pngIndex + 1] = green;
      png.data[pngIndex + 2] = blue;
      png.data[pngIndex + 3] = alpha;
    }
  }

  const options = { colorType: 6 };
  const buffer = PNG.sync.write(png, options);
  writeFileSync(outputPath, buffer);
}

const palette = readFileSync(`${__dirname}/files/cyclops-v1-palette2.act`);
//const buffer = readFileSync(`${__dirname}/files/cyclops-v1.sff`);
const buffer = readFileSync(`${__dirname}/files/cvsryu-v1.sff`);
const data = extract(buffer, {
  palettes: true,
  paletteBuffer: false,
  paletteTable: true,
  spriteBuffer: false,
  decodeSpriteBuffer: true,
  //spriteGroups: [0, 4050, 9000],
  spriteGroups: [42],
  //spriteGroups: [9000],
  //applyPalette: palette,
});

// 109 220 4 1
//console.log(palette.length); process.exit(0);
/*
for (let rgbIndex = 0; rgbIndex < palette.length; rgbIndex+=3) {
  console.log(`${palette[rgbIndex + 0]} ${palette[rgbIndex + 1]} ${palette[rgbIndex + 2]}`);
}
*/

for (const sprite of data.sprites) {
  //console.log(sprite.index, sprite.group, sprite.number, sprite.samePalette);
  //console.log(sprite);

  ///*
  console.log(
    `Generating sprite, group ${sprite.group}, number ${sprite.number} ...`
  );
  saveAsPNG(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
    `${__dirname}/sprites/${sprite.group}-${sprite.number}.png`
  );
  //*/
}
