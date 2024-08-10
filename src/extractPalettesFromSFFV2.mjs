export default function extractPalettesFromSFFV2(buffer, metadata) {
  // Palette Map, linear 16bytes per map
  const paletteMapSize = 16;
  const palettes = [];
  for (
    let paletteIndex = 0;
    paletteIndex < metadata.paletteCount;
    paletteIndex++
  ) {
    const group = buffer.readUInt16LE(
      metadata.paletteMapOffset + paletteIndex * paletteMapSize,
    );

    const number = buffer.readUInt16LE(
      metadata.paletteMapOffset + paletteIndex * paletteMapSize + 0x02,
    );

    const colorCount = buffer.readUInt32LE(
      metadata.paletteMapOffset + paletteIndex * paletteMapSize + 0x04,
    );

    const dataOffset = buffer.readUInt32LE(
      metadata.paletteMapOffset + paletteIndex * paletteMapSize + 0x08,
    );
    let dataLength = buffer.readUInt32LE(
      metadata.paletteMapOffset + paletteIndex * paletteMapSize + 0x0c,
    );

    let paletteBuffer = buffer.subarray(
      metadata.paletteBankOffset + dataOffset,
      metadata.paletteBankOffset + dataOffset + dataLength,
    );

    // Sometimes, the dataLength is zero
    // In this case, use the first palette buffer
    if (paletteBuffer.length === 0 && palettes.length > 0) {
      paletteBuffer = palettes[0].buffer;
    }

    palettes.push({
      index: paletteIndex,
      group,
      number,
      colorCount,
      dataOffset,
      dataLength,
      buffer: paletteBuffer,
    });
  }

  return palettes;
}
