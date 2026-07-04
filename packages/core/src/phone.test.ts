import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone } from "./phone.js";

test("all common Indian formats collapse to the same E.164", () => {
  const expected = "+919810012345";
  for (const raw of [
    "9810012345",
    "98100 12345",
    "98100-12345",
    "09810012345",
    "919810012345",
    "+91 98100 12345",
    "+91-9810012345",
  ]) {
    assert.equal(normalizePhone(raw), expected, `failed for ${JSON.stringify(raw)}`);
  }
});

test("invalid numbers return null", () => {
  assert.equal(normalizePhone(""), null);
  assert.equal(normalizePhone("12345"), null);
  assert.equal(normalizePhone("5810012345"), null); // starts with 5 — not an Indian mobile
  assert.equal(normalizePhone("98100123456789012"), null);
  assert.equal(normalizePhone("abc"), null);
});

test("explicit non-Indian country codes pass through", () => {
  assert.equal(normalizePhone("+1 415 555 0134"), "+14155550134");
});
