import { stdout } from 'node:process';

export default function printSpriteProgression(index, total) {
  stdout.clearLine(0);
  stdout.cursorTo(0);
  stdout.write(`Sprite ${index + 1} / ${total}`);
}