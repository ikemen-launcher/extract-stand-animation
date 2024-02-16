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

const buffer = readFileSync(`${__dirname}/files/cyclops-v1.sff`);
const data = extract(buffer, {
  palettes: true,
  paletteBuffer: false,
  paletteTable: true,
  spriteBuffer: false,
  decodeSpriteBuffer: true,
  spriteGroups: [0, 9000],
});

for (const sprite of data.sprites) {
  console.log(sprite.paletteTable);
  console.log(
    `Generating sprite, group ${sprite.group}, number ${sprite.number} ...`
  );
  saveAsPNG(
    sprite.decodedBuffer,
    sprite.width,
    sprite.height,
    `${__dirname}/sprites/${sprite.group}-${sprite.number}.png`
  );
}
