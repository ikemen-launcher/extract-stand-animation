import test from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import extract from "../index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test("Extract v1 metadata", () => {
  const buffer = readFileSync(`${__dirname}/files/kfm-v2.sff`);
  const data = extract(buffer, { sprites: false, palettes: false });

  assert.strictEqual(data.version, "1.0.1.0");
});
