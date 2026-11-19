import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../src/core/errors.js";
import {
  jsonFailure,
  jsonSuccess,
  serializeJson,
} from "../src/core/output.js";

test("serializes one JSON document with a trailing newline", () => {
  const serialized = serializeJson(jsonSuccess("version", { version: "5.0.0" }));
  assert.equal(serialized.endsWith("\n"), true);
  assert.equal(serialized.trim().split("\n").length, 1);

  const parsed = JSON.parse(serialized) as {
    ok: boolean;
    command: string;
    data: { version: string };
  };

  assert.equal(parsed.ok, true);
  assert.equal(parsed.command, "version");
  assert.equal(parsed.data.version, "5.0.0");
});

test("serializes failures with code, message, and details", () => {
  const envelope = jsonFailure(
    "config validate",
    new AppError("CONFIG_INVALID", "Config validation failed", {
      details: { issues: [{ path: "ai.provider" }] },
    }),
  );

  const parsed = JSON.parse(serializeJson(envelope)) as {
    ok: boolean;
    error: { code: string; details: { issues: unknown[] } };
  };

  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, "CONFIG_INVALID");
  assert.equal(parsed.error.details.issues.length, 1);
});

test("omits details when there are none", () => {
  const envelope = jsonFailure("status", new AppError("NOT_A_REPOSITORY", "nope"));
  assert.equal("details" in envelope.error, false);
});
