export default function extractMetadataFromSFFV2(data) {
  // Version
  const build = data.readUInt8(12);
  const patch = data.readUInt8(13);
  const minor = data.readUInt8(14);
  const major = data.readUInt8(15);
  const version = `${major}.${minor}.${patch}.${build}`;

  const paletteMapOffset = data.readUInt32LE(0x1a);
  const spriteListOffset = data.readUInt32LE(0x24);
  const spriteCount = data.readUInt32LE(0x28);
  const paletteCount = data.readUInt32LE(0x30);
  const paletteBankOffset = data.readUInt32LE(0x34);
  const onDemandDataSize = data.readUInt32LE(0x38);
  const onDemandDataSizeTotal = data.readUInt32LE(0x3c);
  const onLoadDataSize = data.readUInt32LE(0x40);

  // ??? between 0x44 and paletteMapOffset

  return {
    version,
    paletteMapOffset,
    spriteListOffset,
    spriteCount,
    paletteCount,
    paletteBankOffset,
    onDemandDataSize,
    onDemandDataSizeTotal,
    onLoadDataSize
  };
}