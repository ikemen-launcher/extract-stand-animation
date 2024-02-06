import { readFileSync } from 'node:fs';

const data = readFileSync('data/kfm.sff');

function printBetweenTwoOffset(from, to) {
  for (let i = from; i < to; i++) {
    console.log(data.readUInt8(i));
  }
}

// Header
const signature = data.toString('ascii', 0, 11);
const VersionLo3 = data.readUInt8(12);
const VersionLo2 = data.readUInt8(13);
const VersionLo1 = data.readUInt8(14);
const VersionHi = data.readUInt8(15);
console.log(`${signature}, version ${VersionHi}.${VersionLo1}.${VersionLo2}.${VersionLo3}`);

const paletteMapOffset = data.readUInt32LE(0x1A);
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

const onDemandDataSizeTotal = data.readUInt32LE(0x3C);
console.log(`OnDemand DataSize Total: ${onDemandDataSizeTotal}`);

const onLoadDataSize = data.readUInt32LE(0x40);
console.log(`OnLoad DataSize: ${onLoadDataSize}`);

// ??? between 0x44 and paletteMapOffset

// Palette Map, linear 16bytes per map
const paletteMapSize = 16;
for (let paletteIndex = 0; paletteIndex < paletteCount; paletteIndex++) {
  console.log(`Palette ${paletteIndex + 1}:`);

  const paletteGroup = data.readUInt16LE(paletteMapOffset + paletteIndex * paletteMapSize);
  console.log(`  Group: ${paletteGroup}`);

  const paletteNumber = data.readUInt16LE(paletteMapOffset + paletteIndex * paletteMapSize + 0x02);
  console.log(`  Number: ${paletteNumber}`);

  const colorCount = data.readUInt32LE(paletteMapOffset + paletteIndex * paletteMapSize + 0x04);
  console.log(`  Color count: ${colorCount}`);

  const dataOffset = data.readUInt32LE(paletteMapOffset + paletteIndex * paletteMapSize + 0x08);
  console.log(`  Offset to data: ${dataOffset}`);

  const length = data.readUInt32LE(paletteMapOffset + paletteIndex * paletteMapSize + 0x0C);
  console.log(`  Length: ${length}`);
}

// Sprite List, linear 28bytes per node
const spriteNodeSize = 28;
for (let spriteIndex = 0; spriteIndex < spriteCount; spriteIndex++) {
  console.log(`Sprite node ${spriteIndex + 1}:`);

  const spriteGroup = data.readUInt16LE(spriteListOffset + spriteIndex * spriteNodeSize);
  console.log(`  Group: ${spriteGroup}`);

  const spriteNumber = data.readUInt16LE(spriteListOffset + spriteIndex * spriteNodeSize + 0x02);
  console.log(`  Number: ${spriteNumber}`);

  const imageWidth = data.readUInt16LE(spriteListOffset + spriteIndex * spriteNodeSize + 0x04);
  const imageHeight = data.readUInt16LE(spriteListOffset + spriteIndex * spriteNodeSize + 0x06);
  console.log(`  Image dimensions: ${imageWidth} x ${imageHeight}`);

  const imageX = data.readUInt16LE(spriteListOffset + spriteIndex * spriteNodeSize + 0x08);
  const imageY = data.readUInt16LE(spriteListOffset + spriteIndex * spriteNodeSize + 0x0A);
  console.log(`  Image position: ${imageX} x ${imageY}`);
}