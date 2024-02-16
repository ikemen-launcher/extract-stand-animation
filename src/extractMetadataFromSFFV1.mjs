export default function extractMetadataFromSFFV1(buffer) {
  // Version
  const build = buffer.readUInt8(12);
  const patch = buffer.readUInt8(13);
  const minor = buffer.readUInt8(14);
  const major = buffer.readUInt8(15);
  const version = `${major}.${minor}.${patch}.${build}`;

  const groupCount = buffer.readUInt32LE(16);
  const spriteCount = buffer.readUInt32LE(20);
  const firstSpriteOffset = buffer.readUInt32LE(24);
  const length = buffer.readUInt32LE(28);
  const paletteType = buffer.readUInt8(32);

  // 33 -> 36 = blank

  const comment = buffer.toString('ascii', 36, 512);

  return {
    version,
    versionMajor: major,
    versionMinor: minor,
    versionPath: patch,
    versionBuild: build,
    groupCount,
    spriteCount,
    firstSpriteOffset,
    length,
    paletteType,
    comment,
  };
}