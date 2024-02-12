import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import saveSpriteAsPng from './saveSpriteAsPng.mjs';
import printSpriteProgression from './printSpriteProgression.mjs';

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

export default function extractSpritesFromSFFV2(data, outputDirectory, options) {
  const metadataFilePath = resolve(outputDirectory, 'metadata.json');
  const metadata = {};

  const build = data.readUInt8(12);
  const patch = data.readUInt8(13);
  const minor = data.readUInt8(14);
  const major = data.readUInt8(15);
  const version = `${major}.${minor}.${patch}.${build}`;
  metadata.version = version;

  const paletteMapOffset = data.readUInt32LE(0x1a);
  //console.log(`Palette map offset: ${paletteMapOffset}`);
  
  const spriteListOffset = data.readUInt32LE(0x24);
  //console.log(`SpriteList offset: ${spriteListOffset}`);
  
  const spriteCount = data.readUInt32LE(0x28);
  //console.log(`Number of sprites: ${spriteCount}`);
  
  const paletteCount = data.readUInt32LE(0x30);
  //console.log(`Number of palettes: ${paletteCount}`);
  
  const paletteBankOffset = data.readUInt32LE(0x34);
  //console.log(`Palette bank offset: ${paletteBankOffset}`);
  
  const onDemandDataSize = data.readUInt32LE(0x38);
  //console.log(`OnDemand DataSize: ${onDemandDataSize}`);
  
  const onDemandDataSizeTotal = data.readUInt32LE(0x3c);
  //console.log(`OnDemand DataSize Total: ${onDemandDataSizeTotal}`);
  
  const onLoadDataSize = data.readUInt32LE(0x40);
  //console.log(`OnLoad DataSize: ${onLoadDataSize}`);
  
  // ??? between 0x44 and paletteMapOffset

  writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));
  
  // Palette Map, linear 16bytes per map
  const paletteMapSize = 16;
  const palettes = [];
  for (let paletteIndex = 0; paletteIndex < paletteCount; paletteIndex++) {
    //console.log(`Palette index ${paletteIndex}:`);
  
    const paletteGroup = data.readUInt16LE(
      paletteMapOffset + paletteIndex * paletteMapSize
    );
    //console.log(`  Group: ${paletteGroup}`);
  
    const paletteNumber = data.readUInt16LE(
      paletteMapOffset + paletteIndex * paletteMapSize + 0x02
    );
    //console.log(`  Number: ${paletteNumber}`);
  
    const colorCount = data.readUInt32LE(
      paletteMapOffset + paletteIndex * paletteMapSize + 0x04
    );
    //console.log(`  Color count: ${colorCount}`);
  
    const dataOffset = data.readUInt32LE(
      paletteMapOffset + paletteIndex * paletteMapSize + 0x08
    );
    const dataLength = data.readUInt32LE(
      paletteMapOffset + paletteIndex * paletteMapSize + 0x0c
    );
    //console.log(`  Data: offset ${dataOffset}, length ${dataLength}`);
  
    // Load palette
    const paletteBuffer = data.subarray(
      paletteBankOffset + dataOffset,
      paletteBankOffset + dataOffset + dataLength
    );
    /*
    // Debug
    for (let i = 0; i < paletteBuffer.length; i += 4) {
      console.log(`    RGBA ${i}: ${paletteBuffer[i]}, ${paletteBuffer[i+1]}, ${paletteBuffer[i+2]}, ${paletteBuffer[i+3]}`);
    }
    //*/
    palettes.push(paletteBuffer);
  }
  
  // Sprite List, linear 28bytes per node
  const spriteNodeSize = 28;
  const sprites = [];
  for (let spriteIndex = 0; spriteIndex < spriteCount; spriteIndex++) {
    const sprite = {};
    
    //console.log(`Sprite node index ${spriteIndex}:`);
  
    const spriteGroup = data.readUInt16LE(
      spriteListOffset + spriteIndex * spriteNodeSize
    );
    //console.log(`  Group: ${spriteGroup}`);
    sprite.group = spriteGroup;
  
    const spriteNumber = data.readUInt16LE(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x02
    );
    //console.log(`  Number: ${spriteNumber}`);
    sprite.number = spriteNumber;
  
    const imageWidth = data.readUInt16LE(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x04
    );
    const imageHeight = data.readUInt16LE(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x06
    );
    //console.log(`  Image dimensions: ${imageWidth} x ${imageHeight}`);
    sprite.width = imageWidth;
    sprite.height = imageHeight;
  
    const imageX = data.readUInt16LE(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x08
    );
    const imageY = data.readUInt16LE(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x0a
    );
    //console.log(`  Image position: ${imageX} x ${imageY}`);
    sprite.x = imageX;
    sprite.y = imageY;
  
    const linkedIndex = data.readUInt16LE(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x0c
    );
    //console.log(`  Sprite linked index: ${linkedIndex}`);
    sprite.linkedIndex = linkedIndex;
    if (linkedIndex > 0) {
      const linkedSprite = sprites[linkedIndex];
  
      saveSpriteAsPng(
        spriteGroup,
        spriteNumber,
        linkedSprite.spriteBuffer,
        linkedSprite.width,
        linkedSprite.height,
        palettes[linkedSprite.paletteIndex],
        linkedSprite.compressionMethod
      );
      sprites.push(sprite);
      continue;
    }
  
    const compressionMethodValue = data.readUInt8(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x0e
    );
    const compressionMethod = stringifyCompressionMethod(compressionMethodValue);
    //console.log(`  Compression method: ${compressionMethod}`);
    sprite.compressionMethod = compressionMethod;
  
    const colorDepth = data.readUInt8(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x0f
    );
    //console.log(`  Color depth: ${colorDepth}`);
    sprite.colorDepth = colorDepth;
  
    const dataOffset = data.readUInt32LE(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x10
    );
    const dataLength = data.readUInt32LE(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x14
    );
    //console.log(`  Data: offset ${dataOffset}, length ${dataLength}`);
    sprite.dataOffset = dataOffset;
    sprite.dataLength = dataLength;
    if (dataLength === 0) {
      throw new Error(`Invalid sprite, length: 0`);
    }
  
    const paletteIndex = data.readUInt16LE(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x18
    );
    //console.log(`  Palette index: ${paletteIndex}`);
    sprite.paletteIndex = paletteIndex;
    const loadMode = data.readUInt16LE(
      spriteListOffset + spriteIndex * spriteNodeSize + 0x1a
    );
    //console.log(`  Load Mode: ${loadMode}`);
    sprite.loadMode = loadMode;
  
    const spriteBuffer = data.subarray(
      paletteBankOffset + dataOffset,
      paletteBankOffset + dataOffset + dataLength
    );
    sprite.spriteBuffer = spriteBuffer;
    saveSpriteAsPng(
      spriteGroup,
      spriteNumber,
      spriteBuffer,
      imageWidth,
      imageHeight,
      palettes[paletteIndex],
      compressionMethod
    );
  
    sprites.push(sprite);

    printSpriteProgression(spriteIndex, spriteCount, spriteGroup, spriteNumber);
  }
}