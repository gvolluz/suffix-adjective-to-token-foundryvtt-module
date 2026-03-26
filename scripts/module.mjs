const MODULE_ID = "suffix-adjective-to-token";
const COUNT_SUFFIX_PATTERN = "(?:\\(\\d+\\)|#\\d+|\\d+)";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);
});

Hooks.on("preCreateToken", (tokenDocument, data, options, userId) => {
  if (userId !== game.user?.id) return;

  const renamed = getSuffixedName(tokenDocument);
  if (!renamed || renamed === tokenDocument.name) return;

  tokenDocument.updateSource({ name: renamed });
});

Hooks.on("createToken", async (tokenDocument, options, userId) => {
  if (userId !== game.user?.id) return;

  const renamed = getSuffixedName(tokenDocument);
  if (!renamed || renamed === tokenDocument.name) return;

  await tokenDocument.update({ name: renamed });
});

function getSuffixedName(tokenDocument) {
  if (!tokenDocument?.prependAdjective) return null;
  if (typeof tokenDocument.name !== "string") return null;

  const actorName = tokenDocument.actor?.name;
  return reorderAroundActorName(tokenDocument.name, actorName) ?? moveFirstWordToEnd(tokenDocument.name);
}

function reorderAroundActorName(currentName, actorName) {
  if (typeof actorName !== "string") return null;

  const cleanCurrent = currentName.trim();
  const cleanActor = actorName.trim();
  if (!cleanCurrent || !cleanActor || cleanCurrent === cleanActor) return null;

  const pattern = new RegExp(`^(.+?)\\s+${escapeRegExp(cleanActor)}(?:\\s+(${COUNT_SUFFIX_PATTERN}))?$`);
  const match = pattern.exec(cleanCurrent);
  if (!match) return null;

  const adjective = match[1]?.trim();
  const countSuffix = match[2]?.trim();
  if (!adjective) return null;

  return [cleanActor, adjective, countSuffix].filter(Boolean).join(" ");
}

function moveFirstWordToEnd(currentName) {
  const cleanCurrent = currentName.trim();
  const pattern = new RegExp(`^(\\S+)\\s+(.+?)(?:\\s+(${COUNT_SUFFIX_PATTERN}))?$`);
  const match = pattern.exec(cleanCurrent);
  if (!match) return null;

  const adjective = match[1]?.trim();
  const remainder = match[2]?.trim();
  const countSuffix = match[3]?.trim();
  if (!adjective || !remainder) return null;

  return [remainder, adjective, countSuffix].filter(Boolean).join(" ");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}