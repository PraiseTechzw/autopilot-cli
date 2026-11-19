import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PRODUCT_VERSION } from "../src/version.js";

test("product version matches package.json", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
  ) as { version: string };

  assert.equal(PRODUCT_VERSION, packageJson.version);
});
