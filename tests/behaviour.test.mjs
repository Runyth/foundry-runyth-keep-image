// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
// Token-image memory and placement behaviour for Runyth Keep Image.
import test from "node:test";
import assert from "node:assert/strict";

const registry = new Map();
globalThis.Hooks = {
  on(event, listener) {
    if (!registry.has(event)) registry.set(event, []);
    registry.get(event).push(listener);
  },
  once(event, listener) {
    this.on(event, listener);
  }
};
globalThis.foundry = {
  utils: {
    getProperty: (object, key) =>
      key.split(".").reduce((walked, part) => (walked === undefined || walked === null ? undefined : walked[part]), object)
  }
};
const CLIENT = "image-keeper";
globalThis.game = { user: { id: CLIENT } };

await import("../scripts/runyth-keep-image.mjs");

const updateListener = registry.get("updateToken")[0];
const createListener = registry.get("preCreateToken")[0];

assert.equal(typeof updateListener, "function");
assert.equal(typeof createListener, "function");

const WILDCARD_SOURCE = "mysteries/creature-*.webp";

function makeActor({ owned = true, wildcard = true, remembered = undefined, prototypeSource = WILDCARD_SOURCE } = {}) {
  return {
    isOwner: owned,
    prototypeToken: { randomImg: wildcard, texture: { src: prototypeSource } },
    memories: [],
    async setFlag(scope, flag, value) {
      this.memories.push({ scope, flag, value });
        this.remembered = value;
    },
    getFlag() {
      return this.remembered;
    }
  };
}

function makeTokenDocument(actor, applied = []) {
  return {
    actor,
    updates: applied,
    updateSource(patch) {
      this.updates.push(patch);
    }
  };
}

async function updateToken(tokenDocument, changes, userId = CLIENT) {
  await updateListener(tokenDocument, changes, {}, userId);
}

function preCreateToken(tokenDocument, userId = CLIENT) {
  return createListener(tokenDocument, {}, {}, userId);
}

test("the module registers its two hooks and announces readiness", () => {
  assert.ok(registry.has("updateToken"));
  assert.ok(registry.has("preCreateToken"));
  assert.ok(registry.has("ready"));
});

test("a concrete image change on an owned wildcard token is remembered on the actor", async () => {
  const actor = makeActor();
  actor.remembered = "mysteries/first.webp";
  const tokenDocument = makeTokenDocument(actor);
  await updateToken(tokenDocument, { texture: { src: "mysteries/second.webp" } });
  assert.deepEqual(
    actor.memories,
    [{ scope: "runyth-keep-image", flag: "lastImage", value: "mysteries/second.webp" }]
  );
});

test("a newer concrete image replaces the older memory", async () => {
  const actor = makeActor();
  await updateToken(makeTokenDocument(actor), { texture: { src: "mysteries/first.webp" } });
  await updateToken(makeTokenDocument(actor), { texture: { src: "mysteries/second.webp" } });
  assert.equal(actor.memories.at(-1).value, "mysteries/second.webp");
  assert.equal(actor.memories.length, 2);
});

test("wildcard, templated, blank, and placeholder images are never remembered", async () => {
  for (const image of ["mysteries/creature-*.webp", "mysteries/{shape}.webp", "", "icons/svg/mystery-man.svg", undefined, 42]) {
    const actor = makeActor();
    await updateToken(makeTokenDocument(actor), { texture: { src: image } });
    assert.equal(actor.memories.length, 0, `rejected image ${String(image)}`);
  }
  const actor = makeActor();
  const tokenDocument = makeTokenDocument(actor);
  await updateToken(tokenDocument, { texture: {} });
  await updateToken(tokenDocument, {});
  assert.equal(actor.memories.length, 0);
});

test("image changes from another client are ignored", async () => {
  const actor = makeActor();
  await updateToken(makeTokenDocument(actor), { texture: { src: "mysteries/other.webp" } }, "someone-else");
  assert.equal(actor.memories.length, 0);
});

test("actors the client does not own are ignored", async () => {
  const actor = makeActor({ owned: false });
  await updateToken(makeTokenDocument(actor), { texture: { src: "mysteries/foreign.webp" } });
  assert.equal(actor.memories.length, 0);
});

test("actors without a wildcard prototype are ignored", async () => {
  const fixedActor = makeActor({ wildcard: false, prototypeSource: "mysteries/fixed.webp" });
  await updateToken(makeTokenDocument(fixedActor), { texture: { src: "mysteries/new.webp" } });
  assert.equal(fixedActor.memories.length, 0);

  const fixedSourceWildcardActor = makeActor({ prototypeSource: "mysteries/fixed.webp" });
  await updateToken(makeTokenDocument(fixedSourceWildcardActor), { texture: { src: "mysteries/new.webp" } });
  assert.equal(fixedSourceWildcardActor.memories.length, 0);

  const missingPrototypeActor = makeActor();
  delete missingPrototypeActor.prototypeToken;
  await updateToken(makeTokenDocument(missingPrototypeActor), { texture: { src: "mysteries/new.webp" } });
  assert.equal(missingPrototypeActor.memories.length, 0);
});

test("remembering never writes into the token document", async () => {
  const actor = makeActor();
  const tokenDocument = makeTokenDocument(actor);
  await updateToken(tokenDocument, { texture: { src: "mysteries/kept.webp" } });
  assert.equal(actor.memories.length, 1);
  assert.equal(tokenDocument.updates.length, 0);
});

test("a placed token reuses the remembered image", async () => {
  const actor = makeActor();
  actor.remembered = "mysteries/kept.webp";
  const tokenDocument = makeTokenDocument(actor);
  await preCreateToken(tokenDocument);
  assert.deepEqual(tokenDocument.updates, [{ "texture.src": "mysteries/kept.webp" }]);
});

test("a placed token without a remembered image is left untouched", async () => {
  const actor = makeActor();
  const tokenDocument = makeTokenDocument(actor);
  await preCreateToken(tokenDocument);
  assert.equal(tokenDocument.updates.length, 0);
});

test("non-wildcard actors are not redirected at placement", async () => {
  const actor = makeActor({ wildcard: false, prototypeSource: "mysteries/fixed.webp" });
  actor.remembered = "mysteries/kept.webp";
  const tokenDocument = makeTokenDocument(actor);
  await preCreateToken(tokenDocument);
  assert.equal(tokenDocument.updates.length, 0);
});

test("placement from another client is ignored", async () => {
  const actor = makeActor();
  actor.remembered = "mysteries/kept.webp";
  const tokenDocument = makeTokenDocument(actor);
  await preCreateToken(tokenDocument, "someone-else");
  assert.equal(tokenDocument.updates.length, 0);
});

test("placement for an actor without a token document is ignored", async () => {
  const tokenDocument = makeTokenDocument(undefined);
  await preCreateToken(tokenDocument);
  assert.equal(tokenDocument.updates.length, 0);
});

test("placement only rewrites the image source", async () => {
  const actor = makeActor();
  actor.remembered = "mysteries/kept.webp";
  const tokenDocument = makeTokenDocument(actor);
  await preCreateToken(tokenDocument);
  assert.equal(tokenDocument.updates.length, 1);
  assert.deepEqual(Object.keys(tokenDocument.updates[0]), ["texture.src"]);
});

test("an unusable remembered image is never applied", async () => {
  for (const remembered of ["mysteries/creature-*.webp", "mysteries/{shape}.webp", "", "icons/svg/mystery-man.svg", 42]) {
    const actor = makeActor();
    actor.remembered = remembered;
    const tokenDocument = makeTokenDocument(actor);
    await preCreateToken(tokenDocument);
    assert.equal(tokenDocument.updates.length, 0, `ignored remembered image ${String(remembered)}`);
  }
});
