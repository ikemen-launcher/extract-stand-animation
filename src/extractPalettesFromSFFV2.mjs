export default function extractPalettesFromSFFV2(buffer, metadata, options) {
  // Palette Map, linear 16bytes per map
  const paletteMapSize = 16;
  const palettes = [];
  for (
    let paletteIndex = 0;
    paletteIndex < metadata.paletteCount;
    paletteIndex++
  ) {
    const group = buffer.readUInt16LE(
      metadata.paletteMapOffset + paletteIndex * paletteMapSize
    );

    const number = buffer.readUInt16LE(
      metadata.paletteMapOffset + paletteIndex * paletteMapSize + 0x02
    );

    const colorCount = buffer.readUInt32LE(
      metadata.paletteMapOffset + paletteIndex * paletteMapSize + 0x04
    );

    const dataOffset = buffer.readUInt32LE(
      metadata.paletteMapOffset + paletteIndex * paletteMapSize + 0x08
    );
    const dataLength = buffer.readUInt32LE(
      metadata.paletteMapOffset + paletteIndex * paletteMapSize + 0x0c
    );

    const palette = {
      group,
      number,
      colorCount,
      dataOffset,
      dataLength,
    };

    if (options.paletteBuffer) {
      const paletteBuffer = buffer.subarray(
        metadata.paletteBankOffset + dataOffset,
        metadata.paletteBankOffset + dataOffset + dataLength
      );
      Object.assign(palette, { buffer: paletteBuffer });
    }

    if (options.paletteTable) {
      const paletteBuffer = buffer.subarray(
        metadata.paletteBankOffset + dataOffset,
        metadata.paletteBankOffset + dataOffset + dataLength
      );
      const table = [];
      for (let i = 0; i < paletteBuffer.length; i += 4) {
        const red = paletteBuffer[i];
        const green = paletteBuffer[i + 1];
        const blue = paletteBuffer[i + 2];
        const alpha = paletteBuffer[i + 3];
        table.push([red, green, blue, alpha]);
      }

      Object.assign(palette, { table });
    }

    palettes.push(palette);
  }

  return palettes;
}
