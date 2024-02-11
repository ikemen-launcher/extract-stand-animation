import convertPaletteRGBtoRGBA from './convertPaletteRGBtoRGBA.mjs';

export default function decodePCX(buffer, width, height, palette) {
  const metadata = {};
  let offset = 0;

  const id = buffer.readUInt8(offset);
  console.log(`  PCX id: ${id}`);
  offset += 1;
  
  const version = buffer.readUInt8(offset);
  console.log(`  PCX version: ${version}`);
  offset += 1;
  
  const encoding = buffer.readUInt8(offset);
  console.log(`  PCX encoding: ${encoding}`);
  offset += 1;
  
  const bitPerPixel = buffer.readUInt8(offset);
  console.log(`  PCX bitPerPixel: ${bitPerPixel}`);
  offset += 1;
  
  const x = buffer.readUInt16LE(offset);
  console.log(`  PCX x: ${x}`);
  offset += 2;
  
  const y = buffer.readUInt16LE(offset);
  console.log(`  PCX y: ${y}`);
  offset += 2;
  
  let pcxWidth = buffer.readUInt16LE(offset);
  console.log(`  PCX width: ${pcxWidth}`);
  offset += 2;
  
  let pcxHeight = buffer.readUInt16LE(offset);
  console.log(`  PCX height: ${pcxHeight}`);
  offset += 2;
  
  const hres = buffer.readUInt16LE(offset);
  console.log(`  PCX hres: ${hres}`);
  offset += 2;
  
  const vres = buffer.readUInt16LE(offset);
  console.log(`  PCX vres: ${vres}`);
  offset += 2;
  
  const colorMap = []; // 16 colors rgb
  for (var i = 0; i < 16; i++) {
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
  console.log(`  PCX reserved: ${reserved}`);
  offset += 1;
  
  const nbPlanes = buffer.readUInt8(offset);
  console.log(`  PCX nbPlanes: ${nbPlanes}`);
  offset += 1;
  
  const bpl = buffer.readUInt16LE(offset);
  console.log(`  PCX bpl: ${bpl}`);
  offset += 2;
  
  const paletteInfo = buffer.readUInt16LE(offset);
  console.log(`  PCX paletteInfo: ${paletteInfo}`);
  offset += 2;

  let imagePalette = null; // 256 colors rgb
  if (palette) {
    imagePalette = palette;
  } else {
    const paletteRGB = buffer.subarray(buffer.length - 256 * 3);
    const signature = buffer.readUInt8(buffer.length - 256 * 3 - 1);
    imagePalette = convertPaletteRGBtoRGBA(paletteRGB);
  }

  // Debug palette
  /*
  for (let colorIndex = 0; colorIndex < imagePalette.length; colorIndex += 4) {
    console.log(`    ${imagePalette[colorIndex]}, ${imagePalette[colorIndex + 1]}, ${imagePalette[colorIndex + 2]}, ${imagePalette[colorIndex + 3]}`);
  }
  //*/

  const out = Buffer.alloc(pcxWidth * pcxHeight * 4);
  
  offset = 128;
  let tempX = x;
  let tempY = y;
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
      if (value != 0) {
        var j = (tempX + tempY * pcxWidth) * 4;
        const paletteColorIndex = value * 4;
        out[j + 0] = imagePalette[paletteColorIndex + 0];
        out[j + 1] = imagePalette[paletteColorIndex + 1];
        out[j + 2] = imagePalette[paletteColorIndex + 2];
        out[j + 3] = imagePalette[paletteColorIndex + 3];
      }
      tempX++;
      if (tempX > pcxWidth) {
        tempY++;
        tempX = x;
      }
    }
  }

  return out;
}
