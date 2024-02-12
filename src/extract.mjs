import { readFileSync } from 'node:fs';
import extractSpritesFromSFFV1 from './extractSpritesFromSFFV1.mjs';
import extractSpritesFromSFFV2 from './extractSpritesFromSFFV2.mjs';

export default function extract(filePath, outputDirectory, options) {
  const data = readFileSync(filePath);

  const signature = data.toString('ascii', 0, 11);
  if (signature !== 'ElecbyteSpr') {
    throw new Error(`Invalid file signature: "${signature}"`);
  }

  const build = data.readUInt8(12);
  const patch = data.readUInt8(13);
  const minor = data.readUInt8(14);
  const major = data.readUInt8(15);
  const version = `${major}.${minor}.${patch}.${build}`;

  switch (major) {
    case 1:
      extractSpritesFromSFFV1(data, outputDirectory, options);
      break;
    case 2:
      extractSpritesFromSFFV2(data, outputDirectory, options);
      break;
    default:
      throw new Error(`Invalid version: ${version}`);
  }
}
