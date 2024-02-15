import extractSpritesFromSFFV1 from "./src/extractSpritesFromSFFV1.mjs";
import extractMetadataFromSFFV2 from "./src/extractMetadataFromSFFV2.mjs";
import extractPalettesFromSFFV2 from "./src/extractPalettesFromSFFV2.mjs";
import extractSpritesFromSFFV2 from "./src/extractSpritesFromSFFV2.mjs";

export default function extract(buffer, providedOptions) {
  const options = {
    palettes: true,
    paletteBuffer: true,
    paletteTable: true,
    sprites: true,
    spriteBuffer: true,
    ...providedOptions,
  };

  if (buffer.length < 12) {
    throw new Error(`Invalid file: too small (< 12 bytes)`);
  }

  const signature = buffer.toString("ascii", 0, 11);
  if (signature !== "ElecbyteSpr") {
    throw new Error(`Invalid file signature: "${signature}"`);
  }

  const data = {};

  const majorVersion = buffer.readUInt8(15);
  switch (majorVersion) {
    case 1:
      // extract metadata
      // extract palettes
      extractSpritesFromSFFV1(buffer, outputDirectory, options);
      break;
    case 2:
      const metadata = extractMetadataFromSFFV2(buffer);
      Object.assign(data, metadata);

      const palettes = extractPalettesFromSFFV2(buffer, metadata, options);
      const paletteBuffers = palettes.map((palette) => palette.buffer);
      if (options.palettes) {
        Object.assign(data, { palettes });

        if (options.paletteTable) {
          for (const palette of palettes) {
            const table = [];
            for (let i = 0; i < palette.buffer.length; i += 4) {
              const red = palette.buffer[i];
              const green = palette.buffer[i + 1];
              const blue = palette.buffer[i + 2];
              const alpha = palette.buffer[i + 3];
              table.push([red, green, blue, alpha]);
            }
            palette.table = table;
          }
        }

        if (!options.paletteBuffer) {
          for (const palette of palettes) {
            delete palette.buffer;
          }
        }
      }

      const sprites = extractSpritesFromSFFV2(buffer, metadata, paletteBuffers);
      if (options.sprites) {
        Object.assign(data, { sprites });

        if (!options.spriteBuffer) {
          for (const sprite of sprites) {
            delete sprite.buffer;
          }
        }
      }
      break;
    default:
      throw new Error(`Invalid version: ${version}`);
  }

  return data;
}
