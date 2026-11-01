// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
// Manifest and packaging integrity for Runyth Keep Image.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = (name) => path.join(root, name);
const readJson = (name) => JSON.parse(readFileSync(repo(name), "utf8"));

const manifest = readJson("module.json");
const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");

test("manifest identity", () => {
  assert.equal(manifest.id, "runyth-keep-image");
  assert.equal(manifest.title, "Runyth Keep Image");
  assert.equal(manifest.version, packageJson.version);
  assert.equal(manifest.authors.length, 1);
  assert.equal(manifest.authors[0].name, "Runyth");
  assert.equal(manifest.authors[0].url, "https://github.com/Runyth");
});

test("manifest URL surfaces", () => {
  const version = manifest.version;
  assert.equal(manifest.license, "LICENSE");
  assert.equal(manifest.url, "https://github.com/Runyth/foundry-runyth-keep-image");
  assert.equal(manifest.manifest, "https://github.com/Runyth/foundry-runyth-keep-image/releases/latest/download/module.json");
  assert.equal(
    manifest.download,
    `https://github.com/Runyth/foundry-runyth-keep-image/releases/download/v${version}/runyth-keep-image-v${version}-mod.zip`
  );
});

test("manifest compatibility and runtime files", () => {
  assert.equal(manifest.compatibility.minimum, "13");
  assert.ok(manifest.compatibility.verified);
  for (const entry of manifest.esmodules) {
    assert.ok(existsSync(repo(entry)), `${entry} must exist`);
    assert.match(entry, /scripts\/runyth-keep-image\.(mjs|js)$/);
  }
  assert.ok(existsSync(repo("LICENSE")));
  assert.ok(existsSync(repo("README.md")));
  assert.ok(existsSync(repo("CHANGELOG.md")));
});

test("the companion module is Runyth Cycle Token", () => {
  const requirements = manifest.relationships?.requires ?? [];
  assert.equal(requirements.length, 1);
  assert.equal(requirements[0].id, "runyth-cycle-token");
  assert.equal(requirements[0].type, "module");
  assert.equal(requirements[0].compatibility.minimum, "1.0.0");
});

test("package metadata agrees with the manifest", () => {
  assert.equal(packageJson.name, manifest.id);
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.type, "module");
  assert.equal(packageJson.version, manifest.version);
  assert.equal(packageJson.license, "AGPL-3.0-or-later");
  assert.ok(packageJson.engines.node.includes("22.13.0"));
  assert.equal(packageLock.packages[""].version, manifest.version);
  assert.equal(packageLock.packages[""].license, "AGPL-3.0-or-later");
  assert.equal(packageLock.name, manifest.id);
});
