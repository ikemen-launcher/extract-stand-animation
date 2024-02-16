import convertPaletteRGBtoRGBA from "./convertPaletteRGBtoRGBA.mjs";

export default function extractSpritesFromSFFV1(data, metadata) {
  let previousPalette = null;
  const sprites = [];
  for (
    let index = 0, spriteOffset = metadata.firstSpriteOffset;
    index < metadata.spriteCount;
    index++
  ) {
    //console.log(`Sprite index ${spriteIndex}:`);
    //console.log(`  SpriteOffset: ${spriteOffset}`);

    const nextSpriteOffset = data.readUInt32LE(spriteOffset);
    //console.log(`  NextSpriteOffset: ${nextSpriteOffset}`);

    const spriteSection = data.subarray(spriteOffset, nextSpriteOffset);

    const sprite = {};

    const length = spriteSection.readUInt32LE(4);

    const x = spriteSection.readUInt16LE(8);
    const y = spriteSection.readUInt16LE(10);

    const group = spriteSection.readUInt16LE(12);
    const number = spriteSection.readUInt16LE(14);

    const linkedSpriteIndex = spriteSection.readUInt16LE(16);

    const samePalette = spriteSection.readUInt8(18);

    const comment = spriteSection.toString("ascii", 19, 19 + 14);

    // Wrong supposition: it's possible that the first sprite uses the same palette as the (non-existent) previous sprite
    // Weird but possible
    if (index == 0 && samePalette) {
      /*
      throw new Error(
        "The first sprite cannot reuse the same palette of the previous sprite"
      );
      */
    }

    let palette = null;
    if (samePalette && previousPalette) {
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
        ? data.subarray(spriteOffset + 32, nextSpriteOffset)
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
