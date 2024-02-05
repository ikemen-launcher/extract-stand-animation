import { readFileSync } from 'node:fs';

const data = readFileSync('data/kfm.sff');
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
