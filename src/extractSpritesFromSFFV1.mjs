import saveSpriteAsPng from './saveSpriteAsPng.mjs';
import convertPaletteRGBtoRGBA from './convertPaletteRGBtoRGBA.mjs';
import printSpriteProgression from './printSpriteProgression.mjs';

export default function extractSpritesFromSFFV1(data, outputDirectory, options) {
  const nbGroups = data.readUInt32LE(16);
  //console.log(`nbGroups: ${nbGroups}`);

  const spriteCount = data.readUInt32LE(20);
  //console.log(`spriteCount: ${spriteCount}`);

  const firstSpriteOffset = data.readUInt32LE(24);
  //console.log(`firstSpriteOffset: ${firstSpriteOffset}`);

  const length = data.readUInt32LE(28);
  //console.log(`length: ${length}`);

  const paletteType = data.readUInt8(32);
  //console.log(`paletteType: ${paletteType}`);

  // 33 -> 36 = blank

  const comments = data.toString("ascii", 36, 512);
  //console.log(`comments: ${comments}`);

  let previousPalette = null;
  const sprites = [];
  for (
    let spriteIndex = 0, spriteOffset = firstSpriteOffset;
    spriteIndex < spriteCount;
    spriteIndex++
  ) {
    //console.log(`Sprite index ${spriteIndex}:`);
    //console.log(`  SpriteOffset: ${spriteOffset}`);

    const nextSpriteOffset = data.readUInt32LE(spriteOffset);
    //console.log(`  NextSpriteOffset: ${nextSpriteOffset}`);

    const spriteSection = data.subarray(spriteOffset, nextSpriteOffset);

    const sprite = {};

    const length = spriteSection.readUInt32LE(4);
    sprite.length = length;
    //console.log(`  Length: ${length}`);

    const x = spriteSection.readUInt16LE(8);
    const y = spriteSection.readUInt16LE(10);
    sprite.x = x;
    sprite.y = y;
    //console.log(`  Position: ${x}, ${y}`);

    const spriteGroup = spriteSection.readUInt16LE(12);
    const spriteNumber = spriteSection.readUInt16LE(14);
    sprite.group = spriteGroup;
    sprite.number = spriteNumber;
    //console.log(`  Group: ${spriteGroup}, ${spriteNumber}`);

    const linkedSpriteIndex = spriteSection.readUInt16LE(16);
    sprite.linkedSpriteIndex = linkedSpriteIndex;
    //console.log(`  Linked sprite index: ${linkedSpriteIndex}`);

    const samePalette = spriteSection.readUInt8(18);
    sprite.samePalette = samePalette;
    //console.log(`  Same palette: ${samePalette}`);

    const comment = spriteSection.toString("ascii", 19, 19 + 14);
    sprite.comment = comment;
    //console.log(`  Comment: ${comment}`);

    /*
    // Wrong supposition
    // It's weird but possible
    if (spriteIndex == 0 && samePalette) {
      throw new Error(
        "The first sprite cannot reuse the same palette of the previous sprite"
      );
    }
    */

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
    sprite.palette = palette;

    if (linkedSpriteIndex === 0) {
      const imageBuffer = data.subarray(spriteOffset + 32, nextSpriteOffset);
      sprite.imageBuffer = imageBuffer;
      const width = imageBuffer.readUInt16LE(8); // From PCX format
      const height = imageBuffer.readUInt16LE(10); // From PCX format
      saveSpriteAsPng(
        spriteGroup,
        spriteNumber,
        imageBuffer,
        width,
        height,
        sprite.palette,
        "PCX"
      );
    }

    sprites.push(sprite);
    spriteOffset = nextSpriteOffset;

    printSpriteProgression(spriteIndex, spriteCount, spriteGroup, spriteNumber);
  }
}
