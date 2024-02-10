import { PNG } from "pngjs";
import crc32 from 'crc32';
import { readFileSync, writeFileSync } from "node:fs";

export default function decodePNG8(buffer, width, height, palette) {
  const rawDataOffset = 4; // first 4 octet represents uncompressed length of data
  const length = buffer.readUInt32LE(0);
  if (length !== width * height) {
    throw new Error(
      `The length ${length} does not match ${width * height} (width x height)`
    );
  }

  const data = buffer.subarray(rawDataOffset);

  const isPNG8 = data.subarray(25, 29).toString('hex') === '03000800'; // 03000000
  if (!isPNG8) {
    //throw new Error('Not PNG8');
    // Invalid signature
  }

  // Extraire la palette
  const paletteStart = 33 + 8; // 33 because it contains PNG signature
  const paletteChunkSignatureLength = 8;
  const paletteEnd = paletteStart + paletteChunkSignatureLength + 768; // 256 * 3 color components (RGB)
  const originalPalette = data.subarray(paletteStart, paletteEnd);
  
  for (let paletteIndex = 0, p = 0; paletteIndex < palette.length && p < originalPalette.length; paletteIndex += 4, p += 3) {
    const red = palette[paletteIndex + 0];
    const green = palette[paletteIndex + 1];
    const blue = palette[paletteIndex + 2];
    //const alpha = palette[paletteIndex + 3]; ignore alpha from the palette

    originalPalette[p + 0] = red;
    originalPalette[p + 1] = green;
    originalPalette[p + 2] = blue;
  }

  /*
  const paletteCrc = crc32(originalPalette);
  console.log('paletteCrc:', paletteCrc);
  console.log(parseInt(paletteCrc.substring(0, 2), 16));
  console.log(parseInt(paletteCrc.substring(2, 4), 16));
  console.log(parseInt(paletteCrc.substring(4, 6), 16));
  console.log(parseInt(paletteCrc.substring(6, 8), 16));

  data[paletteEnd] = parseInt(paletteCrc.substring(0, 2), 16);
  data[paletteEnd + 1] = parseInt(paletteCrc.substring(2, 4), 16);
  data[paletteEnd + 2] = parseInt(paletteCrc.substring(4, 6), 16);
  data[paletteEnd + 3] = parseInt(paletteCrc.substring(6, 8), 16);
  */


  //const signatureSecondChunk = data.toString("ascii", paletteEnd, paletteEnd+8);
  //console.log(signatureSecondChunk);
  //console.log(data.toString("ascii", 0, data.length));

  const options = { checkCRC: false };
  var png = PNG.sync.read(data, options);

  ///*
  const colorComponentCount = 4;
  const out = Buffer.alloc(width * height * colorComponentCount, 0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const red = png.data[index + 0];
      const green = png.data[index + 1];
      const blue = png.data[index + 2];
      const alpha = png.data[index + 3];
      //console.log(`  ${red}, ${green}, ${blue}, ${alpha}`);

      out[index + 0] = red;
      out[index + 1] = green;
      out[index + 2] = blue;
      out[index + 3] = alpha;

      // The first color in the palette is considered as transparent
      if (red === palette[0] && green === palette[1] && blue === palette[2]) {
        out[index + 3] = 0;
      }
    }
  }
  return out;
  //*/

  return png.data;
}
