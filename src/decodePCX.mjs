import convertPaletteRGBtoRGBA from './convertPaletteRGBtoRGBA.mjs';

export default function decodePCX(buffer, width, height, palette) {
  let offset = 0;

  const id = buffer.readUInt8(offset);
  //console.log(`  PCX id: ${id}`);
  offset += 1;
  
  const version = buffer.readUInt8(offset);
  //console.log(`  PCX version: ${version}`);
  offset += 1;
  
  const encoding = buffer.readUInt8(offset);
  //console.log(`  PCX encoding: ${encoding}`);
  offset += 1;
  
  const bitPerPixel = buffer.readUInt8(offset);
  //console.log(`  PCX bitPerPixel: ${bitPerPixel}`);
  offset += 1;
  
  const x = buffer.readUInt16LE(offset);
  //console.log(`  PCX x: ${x}`);
  offset += 2;
  
  const y = buffer.readUInt16LE(offset);
  //console.log(`  PCX y: ${y}`);
  offset += 2;
  
  let pcxWidth = buffer.readUInt16LE(offset);
  //console.log(`  PCX width: ${pcxWidth}`);
  offset += 2;
  
  let pcxHeight = buffer.readUInt16LE(offset);
  //console.log(`  PCX height: ${pcxHeight}`);
  offset += 2;
  
  const hres = buffer.readUInt16LE(offset);
  //console.log(`  PCX hres: ${hres}`);
  offset += 2;
  
  const vres = buffer.readUInt16LE(offset);
  //console.log(`  PCX vres: ${vres}`);
  offset += 2;
  
  const colorMap = []; // 16 colors rgb
  for (let i = 0; i < 16; i++) {
    var c = [];
    c[0] = buffer.readUInt8(offset);
    offset += 1;
    c[1] = buffer.readUInt8(offset);
    offset += 1;
    c[2] = buffer.readUInt8(offset);
    offset += 1;
    colorMap.push(c);
  }

  const reserved = buffer.readUInt8(offset);
  //console.log(`  PCX reserved: ${reserved}`);
  offset += 1;
  
  const nbPlanes = buffer.readUInt8(offset);
  //console.log(`  PCX nbPlanes: ${nbPlanes}`);
  offset += 1;
  
  const bpl = buffer.readUInt16LE(offset);
  //console.log(`  PCX bpl: ${bpl}`);
  offset += 2;
  
  const paletteInfo = buffer.readUInt16LE(offset);
  //console.log(`  PCX paletteInfo: ${paletteInfo}`);
  offset += 2;

  const out = Buffer.alloc(pcxWidth * pcxHeight * 4);

  offset = 128;
  /*
  const rle = buffer.subarray(offset);
    let i = 0, j = 0, k = 0, w = pcxWidth;
    while (j < out.length) {
      let n = 1;
      let d = rle[i];
        if (i < rle.length - 1) {
            i++;
        }
        if (d >= 0xc0) {
            n = d & 0x3f;
            d = rle[i];
            if (i < rle.length - 1) {
                i++;
            }
        }
        while (n > 0) {
            if (k < w && j < out.length) {
                out[j] = d;
                j++;
            }
          k++;
            if (k === pcxHeight) {
                k = 0;
                n = 1;
            }
            n--;
        }
    }
    //*/

  ///*
  let tempX = 0;
  let tempY = 0;
  while (tempY < pcxHeight) {
    var b = buffer.readUInt8(offset);
    offset += 1;

    var runcount;
    var value;
    if ((b & 0xc0) == 0xc0) {
      runcount = b & 0x3f;
      value = buffer.readUInt8(offset);
      offset += 1;
    } else {
      runcount = 1;
      value = b;
    }
    for (var i = 0; i < runcount; i++) {
      const isTransparent = value === 0;
      if (!isTransparent) {
        var j = (tempX + tempY * pcxWidth) * 4;
        const paletteColorIndex = value * 4;
        out[j + 0] = palette[paletteColorIndex + 0];
        out[j + 1] = palette[paletteColorIndex + 1];
        out[j + 2] = palette[paletteColorIndex + 2];
        out[j + 3] = palette[paletteColorIndex + 3];
      }
      tempX++;
      if (tempX > pcxWidth) {
        tempY++;
        tempX = 0;
      }
    }
  }
  //*/

  return out;
}
