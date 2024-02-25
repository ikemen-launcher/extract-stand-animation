import { PNG } from "pngjs";

export default function decodePNG8(buffer, width, height, palette) {
  const rawDataOffset = 4; // first 4 octet represents uncompressed length of data
  const length = buffer.readUInt32LE(0);
  if (length !== width * height) {
    throw new Error(
      `The length ${length} does not match ${width * height} (width x height)`,
    );
  }

  const data = buffer.subarray(rawDataOffset);

  const signature = data.subarray(25, 29).toString("hex");
  const isPNG8 = signature === "03000800";
  if (!isPNG8) {
    //throw new Error(`Not PNG8: ${signature}`);
    // SFF contains invalid PNG8 signature (=03000000)
  }

  // Replace the palette
  const paletteStart = 33 + 8; // 33 because it contains PNG signature
  const paletteChunkSignatureLength = 8;
  const paletteEnd = paletteStart + 768 + paletteChunkSignatureLength; // 256 * 3 color components (RGB)
  const originalPalette = data.subarray(paletteStart, paletteEnd);

  let originalPaletteAlreadyOk = false;
  for (let colorIndex = 0; colorIndex < 256; colorIndex++) {
    const red = originalPalette[colorIndex];
    const green = originalPalette[colorIndex + 1];
    const blue = originalPalette[colorIndex + 2];

    // Debug
    //console.log(` R ${red}, G ${green}, B ${blue}`);

    if (red !== 0 || green !== 0 || blue !== 0) {
      originalPaletteAlreadyOk = true;
      break;
    }
  }

  if (!originalPaletteAlreadyOk) {
    for (
      let paletteIndex = 0, p = 0;
      paletteIndex < palette.length && p < originalPalette.length;
      paletteIndex += 4, p += 3
    ) {
      const red = palette[paletteIndex + 0];
      const green = palette[paletteIndex + 1];
      const blue = palette[paletteIndex + 2];
      //const alpha = palette[paletteIndex + 3]; ignore alpha from the palette

      originalPalette[p + 0] = red;
      originalPalette[p + 1] = green;
      originalPalette[p + 2] = blue;
    }
  }

  /*
  // Generate CRC
  const paletteCrc = crc32(originalPalette);
  console.log('paletteCrc:', paletteCrc);
  const crcByte1 = parseInt(paletteCrc.substring(0, 2), 16);
  const crcByte2 = parseInt(paletteCrc.substring(2, 4), 16);
  const crcByte3 = parseInt(paletteCrc.substring(4, 6), 16);
  const crcByte4 = parseInt(paletteCrc.substring(6, 8), 16);
  data[paletteEnd + 0] = crcByte1;
  data[paletteEnd + 1] = crcByte2;
  data[paletteEnd + 2] = crcByte3;
  data[paletteEnd + 3] = crcByte4;
  //*/

  const options = { checkCRC: false }; // The option checkCRC=false prevents to generate a CRC for the palette
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
