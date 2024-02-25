import { PNG } from "pngjs";
//import crc32 from "crc-32";
//import extract from "png-chunks-extract";

function getChunkHeaderOffset(buffer) {
  let offset = 8; // skip the signature

  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32BE(offset);
    offset += 4;
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    offset += 4;

    if (chunkType === "IHDR") {
      return offset - 4;
    }

    // skip data
    offset += chunkLength;

    // CRC
    offset += 4;
  }

  throw new Error("PLTE not found");
}

function getChunkPaletteOffset(buffer) {
  let offset = 8; // skip the signature

  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32BE(offset);
    offset += 4;
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    offset += 4;

    if (chunkType === "PLTE") {
      return offset - 4;
    }

    // skip data
    offset += chunkLength;

    // CRC
    offset += 4;
  }

  throw new Error("PLTE not found");
}

export default function decodePNG8(buffer, width, height, palette) {
  const rawDataOffset = 4; // first 4 octet represents uncompressed length of data
  const length = buffer.readUInt32LE(0);
  if (length !== width * height) {
    // Not true, sometimes x8
    /*
    throw new Error(
      `The length ${length} does not match ${width * height} (width x height)`,
    );
    //*/
  }

  const data = buffer.subarray(rawDataOffset);

  // Debug chunks
  //const extractedChunks = extract(data);
  //console.log(extractedChunks);

  // Replace the palette
  const chunkPaletteOffset = getChunkPaletteOffset(data);
  const paletteStart = chunkPaletteOffset + 4; // 4 for the string PLTE
  const paletteEnd = paletteStart + 768; // 256 * 3 color components (RGB)
  const originalPalette = data.subarray(paletteStart, paletteEnd);

  let originalPaletteAlreadyOk = false;
  for (let colorIndex = 0; colorIndex < 256 * 3; colorIndex += 3) {
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
  //console.log("originalPaletteAlreadyOk", originalPaletteAlreadyOk);
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

  // Debug palette
  /*
  for (let colorIndex = 0; colorIndex < 256 * 3; colorIndex += 3) {
    const red = originalPalette[colorIndex];
    const green = originalPalette[colorIndex + 1];
    const blue = originalPalette[colorIndex + 2];
    console.log(` R ${red}, G ${green}, B ${blue}`);
  }
  //*/

  /*
  // Compute CRC signature for the new palette
  // Install package "crc-32"
  const paletteCrc = crc32.buf(data.subarray(chunkPaletteOffset, chunkPaletteOffset + 4 + 768));
  data.writeInt32BE(paletteCrc, chunkPaletteOffset + 4 + 768);
  //*/

  // The option checkCRC=false prevents to generate a CRC for the palette
  const options = { checkCRC: false };
  const png = PNG.sync.read(data, options);

  const colorComponentCount = 4;
  const out = Buffer.alloc(width * height * colorComponentCount, 0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const red = png.data[index + 0];
      const green = png.data[index + 1];
      const blue = png.data[index + 2];
      //const alpha = png.data[index + 3];
      const alpha = 255;
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
}
