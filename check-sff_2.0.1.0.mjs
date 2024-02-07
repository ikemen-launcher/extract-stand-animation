import { exit } from "node:process";
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";

const data = readFileSync("data/kfm.sff");

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

function decompressLZ5Buffer(compressedBuffer) {
  let decompressedData = Buffer.alloc(0);
  let index = 0;

  while (index < compressedBuffer.length) {
    let controlByte = compressedBuffer[index++];

    for (let i = 0; i < 8; i++) {
      if ((controlByte & (1 << (7 - i))) === 0) {
        // Literal byte
        if (index >= compressedBuffer.length) break;
        decompressedData = Buffer.concat([
          decompressedData,
          Buffer.from([compressedBuffer[index++]]),
        ]);
      } else {
        // Match copy
        if (index + 1 >= compressedBuffer.length) break;
        let length = compressedBuffer[index] >> 4;
        let offset =
          ((compressedBuffer[index] & 0x0f) << 8) | compressedBuffer[index + 1];
        index += 2;

        if (length === 15) {
          let lenByte;
          do {
            if (index >= compressedBuffer.length) break;
            lenByte = compressedBuffer[index++];
            length += lenByte;
          } while (lenByte === 255);
        }
        length += 4;

        let start = decompressedData.length - offset - 1;
        for (let j = 0; j < length; j++) {
          decompressedData = Buffer.concat([
            decompressedData,
            Buffer.from([decompressedData[start + j]]),
          ]);
        }
      }
      if (index >= compressedBuffer.length) break;
    }
  }

  return decompressedData;
}

function decodeRLE8(data, width, height, palette) {
  //first 4 octet represents uncompressed length of data
  //and it must be the same as imgw * imgh
  //and RLE8 is always for 256 indexed colour
  const uncompressedDataLength = data.readUInt32LE(0);
  if (uncompressedDataLength !== width * height) {
    throw new Exception(
      `Invalid RLE8, uncompressed data length should be ${
        width * height
      } (${width} x ${height}), actual: ${uncompressedDataLength}`
    );
  }
  if (data.length < 4) {
    throw new Exception(`Invalid RLE8, too short`);
  }

  const colorComponentCount = 4;
  const out = Buffer.alloc(width * height * colorComponentCount, 0);

  const rawDataOffset = 4; // first 4 octet represents uncompressed length of data
  let x = 0;
  let y = 0;
  let runlength = -1;
  for (let index = 0; index < data.length - rawDataOffset; index++) {
    const paletteValueIndex = data.readUInt8(index + rawDataOffset);

    //0b01xxxxxx is runlength, otherwise raw data
    if ((paletteValueIndex & 0xc0) != 0x40 || runlength != -1) {
      //if not runlength or octet after runlength
      if (runlength == -1) {
        runlength = 1; //always assume runlength = 1
      }
      //Add pixel for runlength times
      for (let ii = 0; ii < runlength; ii++) {
        const red = palette[paletteValueIndex * colorComponentCount + 0];
        const green = palette[paletteValueIndex * colorComponentCount + 1];
        const blue = palette[paletteValueIndex * colorComponentCount + 2];
        const alpha = palette[paletteValueIndex * colorComponentCount + 3];

        out[(y * width + x) * colorComponentCount + 0] = red;
        out[(y * width + x) * colorComponentCount + 1] = green;
        out[(y * width + x) * colorComponentCount + 2] = blue;
        out[(y * width + x) * colorComponentCount + 3] = alpha;

        x++;
        if (x >= width) {
          y++;
          x = 0;
          if (y >= height) {
            break;
          }
        }
      }
      runlength = -1;
      if (y >= height) {
        break;
      }
    } else {
      runlength = paletteValueIndex - 0x40; //if e was 0b01xxxxxx, e - 0x40 is runlen.
    }
  }


  return out;
}

function saveAsPNG(image, width, height, outputPath) {
  console.log("buffer length", image.length);
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
  console.log(`Palette ${paletteIndex + 1}:`);

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

  const paletteNumber = data.readUInt16LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x18
  );
  console.log(`  Palette number: ${paletteNumber}`);
  const loadMode = data.readUInt16LE(
    spriteListOffset + spriteIndex * spriteNodeSize + 0x1a
  );
  console.log(`  Load Mode: ${loadMode}`);

  switch (compressionMethod) {
    case "RLE8":
      const spriteBuffer = data.subarray(
        paletteBankOffset + dataOffset,
        paletteBankOffset + dataOffset + dataLength
      );
      const sprite = decodeRLE8(
        spriteBuffer,
        imageWidth,
        imageHeight,
        palettes[paletteNumber]
      );
      saveAsPNG(
        sprite,
        imageWidth,
        imageHeight,
        `sprites/${spriteGroup}-${spriteNumber}.png`
      );
  }
}
