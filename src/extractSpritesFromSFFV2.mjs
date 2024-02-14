import saveSpriteAsPng from './saveSpriteAsPng.mjs';

function stringifyCompressionMethod(value) {
  switch (value) {
    default:
      return "unknown";
    case 0:
      return "RAW";
    case 1:
      return "LINKED";
    case 2:
      return "RLE8";
    case 3:
      return "RLE5";
    case 4:
      return "LZ5";
    case 0x0a:
      return "PNG8";
    case 0x0b:
      return "PNG24";
    case 0x0c:
      return "PNG32";
  }
}

export default function extractSpritesFromSFFV2(data, metadata, palettes) {
  // Sprite List, linear 28bytes per node
  const spriteNodeSize = 28;
  const sprites = [];
  for (let spriteIndex = 0; spriteIndex < metadata.spriteCount; spriteIndex++) {
    const sprite = {};
    
    //console.log(`Sprite node index ${spriteIndex}:`);
  
    const spriteGroup = data.readUInt16LE(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize
    );
    //console.log(`  Group: ${spriteGroup}`);
    sprite.group = spriteGroup;
  
    const spriteNumber = data.readUInt16LE(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x02
    );
    //console.log(`  Number: ${spriteNumber}`);
    sprite.number = spriteNumber;
  
    const imageWidth = data.readUInt16LE(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x04
    );
    const imageHeight = data.readUInt16LE(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x06
    );
    //console.log(`  Image dimensions: ${imageWidth} x ${imageHeight}`);
    sprite.width = imageWidth;
    sprite.height = imageHeight;
  
    const imageX = data.readUInt16LE(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x08
    );
    const imageY = data.readUInt16LE(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x0a
    );
    //console.log(`  Image position: ${imageX} x ${imageY}`);
    sprite.x = imageX;
    sprite.y = imageY;
  
    const linkedIndex = data.readUInt16LE(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x0c
    );
    //console.log(`  Sprite linked index: ${linkedIndex}`);
    sprite.linkedIndex = linkedIndex;
    if (linkedIndex > 0) {
      const linkedSprite = sprites[linkedIndex];
  
      /*
      saveSpriteAsPng(
        spriteGroup,
        spriteNumber,
        linkedSprite.spriteBuffer,
        linkedSprite.width,
        linkedSprite.height,
        palettes[linkedSprite.paletteIndex],
        linkedSprite.compressionMethod
      );
      */
      sprites.push(sprite);
      continue;
    }
  
    const compressionMethodValue = data.readUInt8(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x0e
    );
    const compressionMethod = stringifyCompressionMethod(compressionMethodValue);
    //console.log(`  Compression method: ${compressionMethod}`);
    sprite.compressionMethod = compressionMethod;
  
    const colorDepth = data.readUInt8(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x0f
    );
    //console.log(`  Color depth: ${colorDepth}`);
    sprite.colorDepth = colorDepth;
  
    const dataOffset = data.readUInt32LE(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x10
    );
    const dataLength = data.readUInt32LE(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x14
    );
    //console.log(`  Data: offset ${dataOffset}, length ${dataLength}`);
    sprite.dataOffset = dataOffset;
    sprite.dataLength = dataLength;
    if (dataLength === 0) {
      throw new Error(`Invalid sprite, length: 0`);
    }
  
    const paletteIndex = data.readUInt16LE(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x18
    );
    //console.log(`  Palette index: ${paletteIndex}`);
    sprite.paletteIndex = paletteIndex;
    const loadMode = data.readUInt16LE(
      metadata.spriteListOffset + spriteIndex * spriteNodeSize + 0x1a
    );
    //console.log(`  Load Mode: ${loadMode}`);
    sprite.loadMode = loadMode;
  
    const spriteBuffer = data.subarray(
      metadata.paletteBankOffset + dataOffset,
      metadata.paletteBankOffset + dataOffset + dataLength
    );
    sprite.spriteBuffer = spriteBuffer;
  
    sprites.push(sprite);
  }

  return sprites;
}