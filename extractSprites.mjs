import { readFileSync } from "node:fs";
import extractSpritesFromSFFV1 from './extractSpritesFromSFFV1.mjs';
import extractSpritesFromSFFV2 from './extractSpritesFromSFFV2.mjs';

export default function extractSprites(filePath) {
  const data = readFileSync(filePath);

  // Header
  const signature = data.toString("ascii", 0, 11);
  const VersionLo3 = data.readUInt8(12);
  const VersionLo2 = data.readUInt8(13);
  const VersionLo1 = data.readUInt8(14);
  const VersionHi = data.readUInt8(15);
  const version = `${VersionHi}.${VersionLo1}.${VersionLo2}.${VersionLo3}`;
  console.log(`  ${signature}, version ${version}`);
  if (VersionHi === 1) {
    extractSpritesFromSFFV1(data);
  }
  
  if (VersionHi === 2) {
    extractSpritesFromSFFV2(data);
  }
}
