#!/usr/bin/env node

import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import extract from './src/extract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(`${__dirname}/package.json`));

const argv = yargs(hideBin(process.argv))
  .usage("$0 -f <file> -o <directory>")

  .alias("f", "file")
  .describe("f", "SFF file")
  .requiresArg("f")

  .alias("o", "output")
  .describe("o", "Output directory")
  .requiresArg("o")

  .check((argv, options) => {
    if (!argv.file) {
      throw new Error('Please provide a SFF file.');
    }
    if (!argv.output) {
      throw new Error('Please provide the output directory.');
    }

    const filePath = resolve(argv.file);
    if (!existsSync(filePath)) {
      throw new Error(`SFF file not found: ${filePath}`);
    }
    argv.file = filePath;
    
    const outputDirectory = resolve(argv.output);
    try {
      mkdirSync(outputDirectory, { recursive: true });
    } catch (error) {
      throw new Error(`Unable to create output directory: ${outputDirectory}`);
    }
    argv.output = outputDirectory;

    return true;
  })

  .example([["$0 -f kfm.sff -o output"]])
  .help()
  .version(pkg.version)
  .parse();

console.log(argv);
extract(argv.file, argv.output, argv);
