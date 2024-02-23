import { readdirSync, statSync, readFileSync } from "node:fs";
import path from "node:path";
import extract from "../index.mjs";

function findFiles(directory, extension) {
  const filePaths = [];

  const files = readdirSync(directory);
  for (let file of files) {
    const filePath = path.join(directory, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      filePaths.push(...findFiles(filePath, extension));
    } else {
      if (path.extname(file) === extension) {
        filePaths.push(filePath);
      }
    }
  }
  return filePaths;
}

const directoryToSearch = process.argv[2];
console.log(`Finding SFF files in ${directoryToSearch} ...`);
const filePaths = findFiles(directoryToSearch, ".sff");

for (const filePath of filePaths) {
  try {
    const buffer = readFileSync(filePath);
    const data = extract(buffer, {
      palettes: false,
      paletteBuffer: false,
      paletteTable: false,
      sprites: true,
      spriteBuffer: false,
      decodeSpriteBuffer: false,
    });

    /*
  if (data.versionMajor === 1 && data.paletteType !== 0) {
    console.log(filePath, data.length, data.paletteType);
  }
  //*/

    //*
    if (data.versionMajor === 2) {
      let found = false;
      for (const sprite of data.sprites) {
        if (sprite.compressionMethod === "PNG8") {
          found = true;
          break;
        }
      }
      if (found) {
        console.log(filePath);
      }
    }
    //*/
  } catch (error) {
    console.error("Fail in", filePath, error);
  }
}
