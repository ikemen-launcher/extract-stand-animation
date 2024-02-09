import { exit } from 'node:process';
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

function decodeSFF(data) {
  var o = {};
  var dv = new DataView(data);
  var offset = 0;

  o.signature = getStringFromDataView(dv, offset, 12); offset += 12;
  o.version = getStringFromDataView(dv, offset, 4); offset += 4;
  o.nbGroups = dv.getUint32(offset, true); offset += 4;
  o.nbImages = dv.getUint32(offset, true); offset += 4;
  o.posFirstSubFile = dv.getUint32(offset, true); offset += 4;
  o.length = dv.getUint32(offset, true); offset += 4;
  o.paletteType = dv.getUint8(offset); offset += 1;
  o.blank = getStringFromDataView(dv, offset, 3); offset += 3;
  o.comments = getStringFromDataView(dv, offset, 476); offset += 476;

  o.SF = [];
  var i = 0;
  var pos = o.posFirstSubFile;
  while (i < o.nbImages) {
      var sf = {};
      var nextSubFile = dv.getUint32(offset, true); offset += 4;
      var subFileLength = dv.getUint32(offset, true); offset += 4;
      sf.x = dv.getUint16(offset, true); offset += 2;
      sf.y = dv.getUint16(offset, true); offset += 2;
      sf.groupNumber = dv.getUint16(offset, true); offset += 2;
      sf.imageNumber = dv.getUint16(offset, true); offset += 2;
      sf.indexPreviousCopy = dv.getUint16(offset, true); offset += 2;
      sf.samePalette = dv.getUint8(offset); offset += 1;
      var comments = getStringFromDataView(dv, offset, 14); offset += 14;
      if (sf.indexPreviousCopy == 0) {
          if(sf.samePalette == 0) {
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
      palette: o.palette
  };
}

//const data = readFileSync('data/kfm.sff');
const data = readFileSync('data/cvsryu.sff');

// Header
const signature = data.toString('ascii', 0, 11);
const VersionLo3 = data.readUInt8(12);
const VersionLo2 = data.readUInt8(13);
const VersionLo1 = data.readUInt8(14);
const VersionHi = data.readUInt8(15);
console.log(`${signature}, version ${VersionHi}.${VersionLo1}.${VersionLo2}.${VersionLo3}`);

const nbGroups = data.readUInt32LE(16);
console.log(`nbGroups: ${nbGroups}`);

const nbImages = data.readUInt32LE(20);
console.log(`nbImages: ${nbImages}`);

const posFirstSubFile = data.readUInt32LE(24);
console.log(`posFirstSubFile: ${posFirstSubFile}`);

const length = data.readUInt32LE(28);
console.log(`length: ${length}`);

const paletteType = data.readUInt8(32);
console.log(`paletteType: ${paletteType}`);

// 33 -> 36 = blank

const comments = data.toString('ascii', 36, 512);
console.log(`comments: ${comments}`);
