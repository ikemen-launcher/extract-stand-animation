import extractMetadataFromSFFV1 from "./src/extractMetadataFromSFFV1.mjs";
import extractSpritesFromSFFV1 from "./src/extractSpritesFromSFFV1.mjs";
import extractMetadataFromSFFV2 from "./src/extractMetadataFromSFFV2.mjs";
import extractPalettesFromSFFV2 from "./src/extractPalettesFromSFFV2.mjs";
import extractSpritesFromSFFV2 from "./src/extractSpritesFromSFFV2.mjs";
import decodeSpriteBuffer from "./src/decodeSpriteBuffer.mjs";
import convertPaletteRGBABufferToTable from "./src/convertPaletteRGBABufferToTable.mjs";

export default function extract(buffer, providedOptions) {
  const options = {
    palettes: true,
    paletteBuffer: true,
    paletteTable: true,
    sprites: true,
    spriteBuffer: true,
    decodeSpriteBuffer: false,
    spriteGroups: [],
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
      {
        const metadata = extractMetadataFromSFFV1(buffer);
        Object.assign(data, metadata);

        if (options.sprites) {
          let sprites = extractSpritesFromSFFV1(buffer, metadata);

          if (options.spriteGroups.length > 0) {
            sprites = sprites.filter((sprite) => {
              return options.spriteGroups.includes(sprite.group);
            });
          }

          Object.assign(data, { sprites });

          for (const sprite of sprites) {
            if (options.palettes) {
              if (options.paletteTable) {
                sprite.paletteTable = convertPaletteRGBABufferToTable(
                  sprite.palette
                );
              }

              if (!options.paletteBuffer) {
                delete sprite.palette;
              }
            } else {
              delete sprite.palette;
            }

            if (options.decodeSpriteBuffer) {
              if (sprite.linkedSpriteIndex > 0) {
                const linkedSprite = sprites[sprite.linkedSpriteIndex];
                sprite.decodedBuffer = linkedSprite.decodedBuffer;
              } else {
                sprite.decodedBuffer = decodeSpriteBuffer(
                  "PCX",
                  sprite.buffer,
                  sprite.width,
                  sprite.height,
                  sprite.palette
                );
              }
            }

            if (!options.spriteBuffer) {
              delete sprite.buffer;
            }
          }
        }
      }
      break;
    case 2:
      {
        const metadata = extractMetadataFromSFFV2(buffer);
        Object.assign(data, metadata);

        const palettes = extractPalettesFromSFFV2(buffer, metadata, options);
        const paletteBuffers = palettes.map((palette) => palette.buffer);
        if (options.palettes) {
          Object.assign(data, { palettes });

          if (options.paletteTable) {
            for (const palette of palettes) {
              palette.table = convertPaletteRGBABufferToTable(palette.buffer);
            }
          }

          if (!options.paletteBuffer) {
            for (const palette of palettes) {
              delete palette.buffer;
            }
          }
        }

        if (options.sprites) {
          let sprites = extractSpritesFromSFFV2(
            buffer,
            metadata,
            paletteBuffers
          );

          if (options.spriteGroups.length > 0) {
            sprites = sprites.filter((sprite) => {
              return options.spriteGroups.includes(sprite.group);
            });
          }

          Object.assign(data, { sprites });

          if (options.decodeSpriteBuffer) {
            for (const sprite of sprites) {
              if (sprite.linkedIndex > 0) {
                const linkedSprite = sprites[sprite.linkedIndex];
                sprite.decodedBuffer = linkedSprite.decodedBuffer;
              } else {
                sprite.decodedBuffer = decodeSpriteBuffer(
                  sprite.compressionMethod,
                  sprite.buffer,
                  sprite.width,
                  sprite.height,
                  paletteBuffers[sprite.paletteIndex]
                );
              }
            }
          }

          if (!options.spriteBuffer) {
            for (const sprite of sprites) {
              delete sprite.buffer;
            }
          }
        }
      }
      break;
    default:
      throw new Error(`Invalid version: ${version}`);
  }

  return data;
}
