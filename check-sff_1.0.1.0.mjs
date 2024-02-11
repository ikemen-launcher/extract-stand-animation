import { readFileSync } from 'node:fs';
import saveSpriteAsPng from './saveSpriteAsPng.mjs';
import convertPaletteRGBtoRGBA from './convertPaletteRGBtoRGBA.mjs';

function decodePalette(buffer) {
  var palette = [];
  var dvp = new DataView(buffer);
  var offset = 0;
  for (var i = 0; i < 256; i++) {
    var c = [];
    c[0] = dvp.getUint8(offset, true);
    offset += 1;
    c[1] = dvp.getUint8(offset, true);
    offset += 1;
    c[2] = dvp.getUint8(offset, true);
    offset += 1;
    palette.push(c);
  }

  return palette;
}

function decodeACT(buffer) {
  var palette = [];
  var dvp = new DataView(buffer);
  var offset = 0;
  for (var i = 0; i < 256; i++) {
    var c = [];
    c[0] = dvp.getUint8(offset, true);
    offset += 1;
    c[1] = dvp.getUint8(offset, true);
    offset += 1;
    c[2] = dvp.getUint8(offset, true);
    offset += 1;
    palette.unshift(c);
  }

  return palette;
}

function decodePCX(buffer, palette) {
  var o = {};
  var dv = new DataView(buffer);
  var offset = 0;

  o.id = dv.getUint8(offset, true);
  offset += 1;
  o.version = dv.getUint8(offset, true);
  offset += 1;
  o.encoding = dv.getUint8(offset, true);
  offset += 1;
  o.bitPerPixel = dv.getUint8(offset, true);
  offset += 1;
  o.x = dv.getUint16(offset, true);
  offset += 2;
  o.y = dv.getUint16(offset, true);
  offset += 2;
  o.width = dv.getUint16(offset, true);
  offset += 2;
  o.height = dv.getUint16(offset, true);
  offset += 2;
  o.hres = dv.getUint16(offset, true);
  offset += 2;
  o.vres = dv.getUint16(offset, true);
  offset += 2;

  o.colorMap = []; // 16 colors rgb
  for (var i = 0; i < 16; i++) {
    var c = [];
    c[0] = dv.getUint8(offset, true);
    offset += 1;
    c[1] = dv.getUint8(offset, true);
    offset += 1;
    c[2] = dv.getUint8(offset, true);
    offset += 1;
    o.colorMap.push(c);
  }

  o.reserved = dv.getUint8(offset, true);
  offset += 1;
  o.nbPlanes = dv.getUint8(offset, true);
  offset += 1;
  o.bpl = dv.getUint16(offset, true);
  offset += 2;
  o.paletteInfo = dv.getUint16(offset, true);
  offset += 2;

  o.palette = []; // 256 colors rgb
  if (typeof palette === "undefined") {
    offset = buffer.byteLength - 769;
    o.signature = dv.getUint8(offset, true);
    offset += 1; // 12

    for (var i = 0; i < 256; i++) {
      var c = [];
      c[0] = dv.getUint8(offset, true);
      offset += 1;
      c[1] = dv.getUint8(offset, true);
      offset += 1;
      c[2] = dv.getUint8(offset, true);
      offset += 1;
      o.palette.push(c);
    }
  } else {
    o.palette = palette;
  }

  offset = 128;

  var x = o.x;
  var y = o.y;
  o.width++;
  o.height++;

  var data = new Uint8ClampedArray(o.width * o.height * 4);
  i = 0;
  while (i < o.width * o.height * 4) {
    data[i++] = 0;
  }

  while (y < o.height) {
    var b = dv.getUint8(offset, true);
    offset += 1;
    var runcount;
    var value;
    if ((b & 0xc0) == 0xc0) {
      runcount = b & 0x3f;
      value = dv.getUint8(offset, true);
      offset += 1;
    } else {
      runcount = 1;
      value = b;
    }
    for (var i = 0; i < runcount; i++) {
      if (value != 0) {
        var j = (x + y * o.width) * 4;
        data[j + 0] = o.palette[value][0];
        data[j + 1] = o.palette[value][1];
        data[j + 2] = o.palette[value][2];
        data[j + 3] = 255;
      }
      x++;
      if (x >= o.width) {
        y++;
        x = o.x;
      }
    }
  }
  //return { data : data, width : o.width, height : o.height };

  var canvas = document.createElement("canvas");
  canvas.width = o.width;
  canvas.height = o.height;
  var ctx = canvas.getContext("2d");
  var imageData = ctx.createImageData(o.width, o.height);
  imageData.data.set(data);
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function decodeSFF(data) {
  var o = {};
  var dv = new DataView(data);
  var offset = 0;

  o.signature = getStringFromDataView(dv, offset, 12);
  offset += 12;
  o.version = getStringFromDataView(dv, offset, 4);
  offset += 4;
  o.nbGroups = dv.getUint32(offset, true);
  offset += 4;
  o.nbImages = dv.getUint32(offset, true);
  offset += 4;
  o.posFirstSubFile = dv.getUint32(offset, true);
  offset += 4;
  o.length = dv.getUint32(offset, true);
  offset += 4;
  o.paletteType = dv.getUint8(offset);
  offset += 1;
  o.blank = getStringFromDataView(dv, offset, 3);
  offset += 3;
  o.comments = getStringFromDataView(dv, offset, 476);
  offset += 476;

  o.SF = [];
  var i = 0;
  var pos = o.posFirstSubFile;
  while (i < o.nbImages) {
    var sf = {};
    var nextSubFile = dv.getUint32(offset, true);
    offset += 4;
    var subFileLength = dv.getUint32(offset, true);
    offset += 4;
    sf.x = dv.getUint16(offset, true);
    offset += 2;
    sf.y = dv.getUint16(offset, true);
    offset += 2;
    sf.groupNumber = dv.getUint16(offset, true);
    offset += 2;
    sf.imageNumber = dv.getUint16(offset, true);
    offset += 2;
    sf.indexPreviousCopy = dv.getUint16(offset, true);
    offset += 2;
    sf.samePalette = dv.getUint8(offset);
    offset += 1;
    var comments = getStringFromDataView(dv, offset, 14);
    offset += 14;
    if (sf.indexPreviousCopy == 0) {
      if (sf.samePalette == 0) {
        sf.image = extractBuffer(dv, offset, nextSubFile);
      } else {
        sf.image = extractBuffer(dv, offset, nextSubFile);
      }
    }
    if (i == 0) {
      o.palette = decodePalette(
        extractBuffer(dv, nextSubFile - 767, nextSubFile)
      );
    }
    offset = nextSubFile;
    o.SF.push(sf);
    i++;
  }
  return {
    images: o.SF,
    palette: o.palette,
  };
}

const data = readFileSync("data/cvsryu.sff");

// Header
const signature = data.toString("ascii", 0, 11);
const VersionLo3 = data.readUInt8(12);
const VersionLo2 = data.readUInt8(13);
const VersionLo1 = data.readUInt8(14);
const VersionHi = data.readUInt8(15);
const version = `${VersionHi}.${VersionLo1}.${VersionLo2}.${VersionLo3}`;
console.log(`${signature}, version ${version}`);
if (VersionHi !== 1) {
  throw new Error(`Unsupported version: ${version}`);
}

const nbGroups = data.readUInt32LE(16);
console.log(`nbGroups: ${nbGroups}`);

const spriteCount = data.readUInt32LE(20);
console.log(`spriteCount: ${spriteCount}`);

const firstSpriteOffset = data.readUInt32LE(24);
console.log(`firstSpriteOffset: ${firstSpriteOffset}`);

const length = data.readUInt32LE(28);
console.log(`length: ${length}`);

const paletteType = data.readUInt8(32);
console.log(`paletteType: ${paletteType}`);

// 33 -> 36 = blank

const comments = data.toString("ascii", 36, 512);
console.log(`comments: ${comments}`);

let previousPalette = null;
const sprites = [];
for (
  let spriteIndex = 0, spriteOffset = firstSpriteOffset;
  spriteIndex < spriteCount;
  spriteIndex++
) {
  console.log(`Sprite index ${spriteIndex}:`);
  const nextSpriteOffset = data.readUInt32LE(spriteOffset);
  console.log(`  SpriteOffset: ${spriteOffset}`);
  console.log(`  NextSpriteOffset: ${nextSpriteOffset}`);
  const spriteSection = data.subarray(spriteOffset, nextSpriteOffset);

  const sprite = {};

  const length = spriteSection.readUInt32LE(4);
  sprite.length = length;
    console.log(`  Length: ${length}`);
    
    const x = spriteSection.readUInt16LE(8);
    const y = spriteSection.readUInt16LE(10);
    sprite.x = x;
    sprite.y = y;
    console.log(`  Position: ${x}, ${y}`);
    
    const spriteGroup = spriteSection.readUInt16LE(12);
    const spriteNumber = spriteSection.readUInt16LE(14);
    sprite.group = spriteGroup;
    sprite.number = spriteNumber;
    console.log(`  Group: ${spriteGroup}, ${spriteNumber}`);
    
    const linkedSpriteIndex = spriteSection.readUInt16LE(16);
    sprite.linkedSpriteIndex = linkedSpriteIndex;
    console.log(`  Linked sprite index: ${linkedSpriteIndex}`);
    
    const samePalette = spriteSection.readUInt8(18);
    sprite.samePalette = samePalette;
    console.log(`  Same palette: ${samePalette}`);
    
    const comment = spriteSection.toString("ascii", 19, 19 + 14);
    sprite.comment = comment;
    console.log(`  Comment: ${comment}`);

  if (spriteIndex == 0 && samePalette) {
      throw new Error('The first sprite cannot reuse the same palette of the previous sprite');
  }
    
    let palette = null;
    if (samePalette) {
        palette = previousPalette;
    } else {
        const paletteRGB = data.subarray(nextSpriteOffset - 256 * 3, nextSpriteOffset);
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
            'PCX'
          );
    }

  sprites.push(sprite);
  spriteOffset = nextSpriteOffset;
}
