import { argv } from 'node:process';
import extractSprites from './extractSprites.mjs';

const filePath = argv[2];
extractSprites(filePath);