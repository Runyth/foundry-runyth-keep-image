const MODULE_ID = "runyth-keep-image";
const KEEP_FLAG = "lastImage";

const MYSTERY_MAN = "icons/svg/mystery-man.svg";

function isConcreteImage(image) {
  return (
    typeof image === "string" &&
    image.length > 0 &&
    !image.includes("*") &&
    !image.includes("{") &&
    image !== MYSTERY_MAN
  );
}

function tracksWildcard(actor) {
  const prototypeToken = actor?.prototypeToken;
  if (!prototypeToken?.randomImg) return false;
  return prototypeToken.texture?.src?.includes("*") ?? false;
}

function isOwnClient(userId) {
  return userId === game.user.id;
}

async function rememberTokenImage(document, changes, options, userId) {
  if (!isOwnClient(userId)) return;
  const image = foundry.utils.getProperty(changes, "texture.src");
  if (!isConcreteImage(image)) return;
  const actor = document.actor;
  if (!actor?.isOwner) return;
  if (!tracksWildcard(actor)) return;
  await actor.setFlag(MODULE_ID, KEEP_FLAG, image);
}

function applyRememberedImage(document, data, options, userId) {
  if (!isOwnClient(userId)) return;
  const actor = document.actor;
  if (!actor) return;
  if (!tracksWildcard(actor)) return;
  const remembered = actor.getFlag(MODULE_ID, KEEP_FLAG);
  if (!isConcreteImage(remembered)) return;
  document.updateSource({ "texture.src": remembered });
}

Hooks.on("updateToken", rememberTokenImage);
Hooks.on("preCreateToken", applyRememberedImage);
Hooks.once("ready", () => console.log(`${MODULE_ID} ready`));
