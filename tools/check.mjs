// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
// Dependency-free validation for Runyth Keep Image.
import { access, readdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(root, "module.json"), "utf8"));
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const packageLock = JSON.parse(await readFile(path.join(root, "package-lock.json"), "utf8"));

function assert(condition, message) {
  if (!condition) {
    process.stderr.write(`Check failed: ${message}\n`);
    process.exit(1);
  }
}

const version = manifest.version;
assert(manifest.id === "runyth-keep-image", "manifest id");
assert(manifest.title === "Runyth Keep Image", "manifest title");
assert(manifest.license === "LICENSE", "manifest licence field");
assert(manifest.url === "https://github.com/Runyth/foundry-runyth-keep-image", "manifest url");
assert(manifest.manifest === "https://github.com/Runyth/foundry-runyth-keep-image/releases/latest/download/module.json", "manifest URL");
assert(
  manifest.download === `https://github.com/Runyth/foundry-runyth-keep-image/releases/download/v${version}/runyth-keep-image-v${version}-mod.zip`,
  "manifest download URL"
);
assert(manifest.authors.length === 1, "manifest must carry exactly one author");
assert(manifest.authors[0].name === "Runyth", "manifest author organisation");
assert(manifest.authors[0].url === "https://github.com/Runyth", "manifest author URL");
assert(manifest.compatibility.minimum === "13", "Foundry minimum pin");
const requirements = manifest.relationships?.requires ?? [];
assert(requirements.length === 1, "exactly one required module");
assert(requirements[0].id === "runyth-cycle-token", "required companion module");
assert(requirements[0].type === "module", "required module relationship type");
assert(requirements[0].compatibility.minimum === "1.0.0", "required module minimum version");

assert(packageJson.name === manifest.id, "package name");
assert(packageJson.version === version, "package version");
assert(packageJson.license === "AGPL-3.0-or-later", "package licence");
assert(packageLock.packages?.[""]?.version === version, "package-lock root version");
assert(packageLock.packages?.[""]?.license === "AGPL-3.0-or-later", "package-lock root licence");

const requiredFiles = [
  "module.json",
  "package.json",
  "package-lock.json",
  "LICENSE",
  "README.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  ...manifest.esmodules
];
for (const relativePath of requiredFiles) {
  await access(path.join(root, relativePath));
}

const scripts = await collectFiles(path.join(root, "scripts"), ".mjs");
assert(scripts.length > 0, "no module scripts found");
for (const script of scripts) {
  const result = spawnSync(process.execPath, ["--check", script], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}

console.log(`Validated ${requiredFiles.length} required files and ${scripts.length} module scripts.`);

async function collectFiles(directory, extension) {
  const entries = await readdir(directory, {
    withFileTypes: true
  });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath, extension));
    } else if (entry.name.endsWith(extension)) {
      files.push(absolutePath);
    }
  }

  return files;
}
