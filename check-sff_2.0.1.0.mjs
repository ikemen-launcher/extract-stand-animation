import { exit } from "node:process";
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import decodeRLE8 from './decodeRLE8.mjs';
import decodeLZ5 from './decodeLZ5.mjs';

//const data = readFileSync("data/kfm.sff");
const data = readFileSync("data/kfm/kfm.sff");

function printBetweenTwoOffset(from, to) {
  for (let i = from; i < to; i++) {
    console.log(data.readUInt8(i));
  }
}

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

// Header
const signature = data.toString("ascii", 0, 11);
const VersionLo3 = data.readUInt8(12);
const VersionLo2 = data.readUInt8(13);
const VersionLo1 = data.readUInt8(14);
const VersionHi = data.readUInt8(15);
console.log(
  `${signature}, version ${VersionHi}.${VersionLo1}.${VersionLo2}.${VersionLo3}`
);

const paletteMapOffset = data.readUInt32LE(0x1a);
console.log(`Palette map offset: ${paletteMapOffset}`);

const spriteListOffset = data.readUInt32LE(0x24);
console.log(`SpriteList offset: ${spriteListOffset}`);

const spriteCount = data.readUInt32LE(0x28);
console.log(`Number of sprites: ${spriteCount}`);

const paletteCount = data.readUInt32LE(0x30);
console.log(`Number of palettes: ${paletteCount}`);

const paletteBankOffset = data.readUInt32LE(0x34);
console.log(`Palette bank offset: ${paletteBankOffset}`);

const onDemandDataSize = data.readUInt32LE(0x38);
console.log(`OnDemand DataSize: ${onDemandDataSize}`);

const onDemandDataSizeTotal = data.readUInt32LE(0x3c);
console.log(`OnDemand DataSize Total: ${onDemandDataSizeTotal}`);

const onLoadDataSize = data.readUInt32LE(0x40);
console.log(`OnLoad DataSize: ${onLoadDataSize}`);

// ??? between 0x44 and paletteMapOffset

// Palette Map, linear 16bytes per map
const paletteMapSize = 16;
const palettes = [];
for (let paletteIndex = 0; paletteIndex < paletteCount; paletteIndex++) {
  console.log(`Palette index ${paletteIndex}:`);

  const paletteGroup = data.readUInt16LE(
    paletteMapOffset + paletteIndex * paletteMapSize
  );
  console.log(`  Group: ${paletteGroup}`);

  const paletteNumber = data.readUInt16LE(
    paletteMapOffset + paletteIndex * paletteMapSize + 0x02
  );
  console.log(`  Number: ${paletteNumber}`);

  const colorCount = data.readUInt32LE(
    paletteMapOffset + paletteIndex * paletteMapSize + 0x04
  );
  console.log(`  Color count: ${colorCount}`);

  const dataOffset = data.readUInt32LE(
    paletteMapOffset + paletteIndex * paletteMapSize + 0x08
  );
  const dataLength = data.readUInt32LE(
    paletteMapOffset + paletteIndex * paletteMapSize + 0x0c
  );
  console.log(`  Data: offset ${dataOffset}, length ${dataLength}`);

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
for (let spriteIndex = 0; spriteIndex < spriteCount; spriteIndex++) {
  console.log(`Sprite node ${spriteIndex + 1}:`);

  const spriteGroup = data.readUInt16LE(
    spriteListOffset + spriteIndex * spriteNodeSize
  );
  console.log(`  Group: ${spriteGroup}`);

  const spriteNumber = data.readUInt16LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x02
  );
  console.log(`  Number: ${spriteNumber}`);

  const imageWidth = data.readUInt16LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x04
  );
  const imageHeight = data.readUInt16LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x06
  );
  console.log(`  Image dimensions: ${imageWidth} x ${imageHeight}`);

  const imageX = data.readUInt16LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x08
  );
  const imageY = data.readUInt16LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x0a
  );
  console.log(`  Image position: ${imageX} x ${imageY}`);

  const linkedIndex = data.readUInt16LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x0c
  );
  console.log(`  Sprite linked index: ${linkedIndex}`);

  const compressionMethodValue = data.readUInt8(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x0e
  );
  const compressionMethod = stringifyCompressionMethod(compressionMethodValue);
  console.log(`  Compression method: ${compressionMethod}`);

  const colorDepth = data.readUInt8(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x0f
  );
  console.log(`  Color depth: ${colorDepth}`);

  const dataOffset = data.readUInt32LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x10
  );
  const dataLength = data.readUInt32LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x14
  );
  console.log(`  Data: offset ${dataOffset}, length ${dataLength}`);

  const paletteIndex = data.readUInt16LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x18
  );
  console.log(`  Palette index: ${paletteIndex}`);
  const loadMode = data.readUInt16LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x1a
  );
  console.log(`  Load Mode: ${loadMode}`);

  if (spriteGroup != 9000 && spriteGroup != 0) {
    exit(0);
  }

  const spriteBuffer = data.subarray(
    paletteBankOffset + dataOffset,
    paletteBankOffset + dataOffset + dataLength
  );
  switch (compressionMethod) {
    case 'RLE8': {
      const sprite = decodeRLE8(
        spriteBuffer,
        imageWidth,
        imageHeight,
        palettes[paletteIndex]
      );
      saveAsPNG(
        sprite,
        imageWidth,
        imageHeight,
        `sprites/${spriteGroup}-${spriteNumber}.png`
      );
    }
      break;
    case 'LZ5': {
      const sprite = decodeLZ5(
        spriteBuffer,
        imageWidth,
        imageHeight,
        palettes[paletteIndex]
      );
      saveAsPNG(
        sprite,
        imageWidth,
        imageHeight,
        `sprites/${spriteGroup}-${spriteNumber}.png`
      );
      //exit(0);
    }
  }
}
