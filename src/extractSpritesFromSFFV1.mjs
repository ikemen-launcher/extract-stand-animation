import convertPaletteRGBtoRGBA from "./convertPaletteRGBtoRGBA.mjs";

export default function extractSpritesFromSFFV1(data, metadata) {
  let previousPalette = null;
  const sprites = [];
  for (
    let index = 0, spriteOffset = metadata.firstSpriteOffset;
    index < metadata.spriteCount;
    index++
  ) {
    const nextSpriteOffset = data.readUInt32LE(spriteOffset);
    const spriteSection = data.subarray(spriteOffset, nextSpriteOffset);

    // Subfile length (not including header)
    // Length is 0 if it is a linked sprite
    const length = spriteSection.readUInt32LE(4);

    const x = spriteSection.readUInt16LE(8);
    const y = spriteSection.readUInt16LE(10);
    const group = spriteSection.readUInt16LE(12);
    const number = spriteSection.readUInt16LE(14);
    const linkedSpriteIndex = spriteSection.readUInt16LE(16);

    // 0 =
    // 1 =
    // 109 = ?
    const samePalette = spriteSection.readUInt8(18);

    const comment = spriteSection.toString("ascii", 19, 19 + 14);

    const c00 = index > 0 || (group === 0 && number === 0);
    const paletteSize = (c00 || samePalette) ? 0 : 256 * 3;

    let palette = null;
    if (samePalette) {
      palette = previousPalette;
    } else {
      const paletteRGB = data.subarray(
        nextSpriteOffset - 256 * 3,
        nextSpriteOffset
      );
      palette = convertPaletteRGBtoRGBA(paletteRGB);
      previousPalette = palette;
    }

    const imageBuffer =
      linkedSpriteIndex === 0
        ? data.subarray(spriteOffset + 32, nextSpriteOffset - paletteSize)
        : sprites[linkedSpriteIndex].buffer;

    // Width and height from PCX format
    const width = imageBuffer.readUInt16LE(8);
    const height = imageBuffer.readUInt16LE(10);

    sprites.push({
      index,
      length,
      x,
      y,
      group,
      number,
      linkedSpriteIndex,
      samePalette,
      paletteSize,
      comment,
      palette,
      buffer: imageBuffer,
      width,
      height,
    });
    spriteOffset = nextSpriteOffset;
  }

  return sprites;
}
