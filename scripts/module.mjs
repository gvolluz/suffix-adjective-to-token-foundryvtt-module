const MODULE_ID = "suffix-adjective-to-token";
const COUNT_SUFFIX_PATTERN = "(?:\\(\\d+\\)|#\\d+|\\d+)";

Hooks.on("preCreateDocument", (document, data, options, userId) => {
  if (document?.documentName !== "Token") return;
  applyRename(document);
});

Hooks.on("createDocument", (document, options, userId) => {
  if (document?.documentName !== "Token") return;
  void applyRename(document, { persisted: true });
});

Hooks.on("preCreateToken", (tokenDocument, data, options, userId) => {
  applyRename(tokenDocument);
});

Hooks.on("createToken", (tokenDocument, options, userId) => {
  void applyRename(tokenDocument, { persisted: true });
});

function applyRename(tokenDocument, { persisted = false } = {}) {
  if (!tokenDocument) return;
  if (persisted && tokenDocument.parent?.isView !== true) return;

  const renamed = getSuffixedName(tokenDocument);
  if (!renamed || renamed === tokenDocument.name) return;

  if (persisted) return tokenDocument.update({ name: renamed });
  tokenDocument.updateSource({ name: renamed });
}

function getSuffixedName(tokenDocument) {
  const prependAdjective = tokenDocument?.actor?.prototypeToken?.prependAdjective;
  if (!prependAdjective) return null;
  if (typeof tokenDocument.name !== "string") return null;

  const actorName = tokenDocument.actor?.name;
  if (isAlreadySuffixed(tokenDocument.name, actorName)) return null;
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

function isAlreadySuffixed(currentName, actorName) {
  if (typeof currentName !== "string" || typeof actorName !== "string") return false;

  const cleanCurrent = currentName.trim();
  const cleanActor = actorName.trim();
  if (!cleanCurrent || !cleanActor || cleanCurrent === cleanActor) return false;

  const pattern = new RegExp(`^${escapeRegExp(cleanActor)}(?:\\s+(${COUNT_SUFFIX_PATTERN}))?(?:\\s+.+)$`);
  return pattern.test(cleanCurrent);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
