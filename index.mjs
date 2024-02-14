import extractSpritesFromSFFV1 from "./src/extractSpritesFromSFFV1.mjs";
import extractMetadataFromSFFV2 from "./src/extractMetadataFromSFFV2.mjs";
import extractPalettesFromSFFV2 from "./src/extractPalettesFromSFFV2.mjs";
import extractSpritesFromSFFV2 from "./src/extractSpritesFromSFFV2.mjs";

export default function extract(buffer, providedOptions) {
  const options = {
    sprites: true,
    palettes: true,
    paletteBuffer: true,
    paletteTable: true,
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
      if (options.palettes) {
        Object.assign(data, { palettes });
      }

      if (options.sprites) {
        const sprites = extractSpritesFromSFFV2(buffer, metadata, palettes);
        Object.assign(data, { sprites });
      }
      break;
    default:
      throw new Error(`Invalid version: ${version}`);
  }

  return data;
}
