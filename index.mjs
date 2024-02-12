#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const pkg = JSON.parse(readFileSync('./package.json'));

const argv = yargs(hideBin(process.argv))
  .usage('$0 -f <file>')
  .alias('f', 'file')
  .describe('f', 'SFF file')
  .epilogue('oh yeah')
  .example('$ ./kfm.sff')
  .version(pkg.version)
  .parse()

console.log('coucou');