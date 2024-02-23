function implementation1(buffer, pcxWidth, pcxHeight, palette) {
  const out = Buffer.alloc(pcxWidth * pcxHeight * 4);

  let offset = 0;
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

  return out;
}

function implementation2(buffer, pcxWidth, pcxHeight, encoding, bpl, palette) {
  const unknownVariable = encoding == 1 ? bpl : 0;
  const out = Buffer.alloc(pcxWidth * pcxHeight * 4);

  const p = Buffer.alloc(pcxWidth * pcxHeight);
  let i = 0,
    j = 0,
    k = 0,
    w = pcxWidth;
  while (j < p.length) {
    let n = 1;
    let d = buffer[i];
    if (i < buffer.length - 1) {
      i++;
    }
    if (d >= 0xc0) {
      n = d & 0x3f;
      d = buffer[i];
      if (i < buffer.length - 1) {
        i++;
      }
    }
    while (n > 0) {
      if (k < w && j < out.length) {
        p[j] = d;
        j++;
      }
      k++;
      if (k === unknownVariable) {
        k = 0;
        n = 1;
      }
      n--;
    }
  }

  for (let ii = 0, aa = 0; ii < p.length; ii++, aa += 4) {
    const paletteColorIndex = p[ii] * 4;

    let red = palette[paletteColorIndex + 0];
    let green = palette[paletteColorIndex + 1];
    let blue = palette[paletteColorIndex + 2];
    let alpha = palette[paletteColorIndex + 3];

    // The first color is always transparent
    if (paletteColorIndex === 0) {
      red = 0;
      green = 0;
      blue = 0;
      alpha = 0;
    }

    out[aa + 0] = red;
    out[aa + 1] = green;
    out[aa + 2] = blue;
    out[aa + 3] = alpha;
  }

  return out;
}

export default function decodePCX(buffer, width, height, palette) {
  let offset = 0;

  const id = buffer.readUInt8(offset);
  offset += 1;

  const version = buffer.readUInt8(offset);
  offset += 1;

  const encoding = buffer.readUInt8(offset);
  offset += 1;

  const bitPerPixel = buffer.readUInt8(offset);
  if (bitPerPixel != 8) {
    throw new Error(`Invalid PCX, bitPerPixel: ${bitPerPixel}`);
  }
  offset += 1;

  const x = buffer.readUInt16LE(offset);
  offset += 2;

  const y = buffer.readUInt16LE(offset);
  offset += 2;

  let pcxWidth = buffer.readUInt16LE(offset);
  offset += 2;

  let pcxHeight = buffer.readUInt16LE(offset);
  offset += 2;

  const hres = buffer.readUInt16LE(offset);
  offset += 2;

  const vres = buffer.readUInt16LE(offset);
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
  offset += 1;

  const nbPlanes = buffer.readUInt8(offset);
  offset += 1;

  const bpl = buffer.readUInt16LE(offset);
  offset += 2;

  const paletteInfo = buffer.readUInt16LE(offset);
  offset += 2;

  offset = 128;
  const imageData = buffer.subarray(offset);

  return implementation2(
    imageData,
    pcxWidth,
    pcxHeight,
    encoding,
    bpl,
    palette,
  );
  //return implementation1(imageData, pcxWidth, pcxHeight, palette);
}
