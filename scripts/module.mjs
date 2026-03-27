const MODULE_ID = "suffix-adjective-to-token";
const COUNT_SUFFIX_PATTERN = "(?:\\(\\d+\\)|#\\d+|\\d+)";
const PHYSICAL_ADJECTIVES = {
  en: {
    onearmed: "One-Armed",
    onelegged: "One-Legged",
    twisted: "Twisted",
    oneeyed: "One-Eyed",
    crosseyed: "Cross-Eyed",
    scarred: "Scarred",
    stitched: "Stitched",
    limping: "Limping",
    hunched: "Hunched",
    scrawny: "Scrawny",
    puny: "Puny",
    mutilated: "Mutilated",
    gaunt: "Gaunt",
    hunchbacked: "Hunchbacked",
    toothless: "Toothless",
    bald: "Bald",
    shaggy: "Shaggy",
    tattooed: "Tattooed",
    pockmarked: "Pockmarked",
    bowlegged: "Bow-Legged",
    misshapen: "Misshapen",
    deformed: "Deformed",
    hobbled: "Hobbled",
    shriveled: "Shriveled",
    potbellied: "Potbellied",
    skinny: "Skinny",
    pitted: "Pitted",
    gangly: "Gangly",
    knotty: "Knotty",
    stubby: "Stubby",
    stocky: "Stocky",
    bony: "Bony",
    frail: "Frail",
    burned: "Burned",
    disfigured: "Disfigured",
    scratched: "Scratched",
    flayed: "Flayed",
    hairy: "Hairy",
    crooked: "Crooked",
    swollen: "Swollen"
  },
  fr: {
    onearmed: "manchot",
    onelegged: "unijambiste",
    twisted: "tordu",
    oneeyed: "borgne",
    crosseyed: "bigleux",
    scarred: "balafré",
    stitched: "recousu",
    limping: "boiteux",
    hunched: "voûté",
    scrawny: "rachitique",
    puny: "malingre",
    mutilated: "mutilé",
    gaunt: "décharné",
    hunchbacked: "bossu",
    toothless: "édenté",
    bald: "chauve",
    shaggy: "hirsute",
    tattooed: "tatoué",
    pockmarked: "pustuleux",
    bowlegged: "cagneux",
    misshapen: "contrefait",
    deformed: "difforme",
    hobbled: "estropié",
    shriveled: "rabougri",
    potbellied: "bedonnant",
    skinny: "maigrichon",
    pitted: "grêlé",
    gangly: "dégingandé",
    knotty: "noueux",
    stubby: "courtaud",
    stocky: "trapu",
    bony: "osseux",
    frail: "chétif",
    burned: "brûlé",
    disfigured: "défiguré",
    scratched: "griffé",
    flayed: "écorché",
    hairy: "velu",
    crooked: "bancal",
    swollen: "boursouflé"
  }
};

Hooks.once("setup", () => {
  replaceCoreAdjectives();
});

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

function replaceCoreAdjectives() {
  const translations = getLanguageAdjectives(game.i18n?.lang);
  if (!translations) return;

  if (game.i18n.translations?.TOKEN) {
    game.i18n.translations.TOKEN.Adjectives = { ...translations };
  }

  if (game.i18n._fallback?.TOKEN) {
    game.i18n._fallback.TOKEN.Adjectives = { ...translations };
  }
}

function getLanguageAdjectives(language) {
  if (language && PHYSICAL_ADJECTIVES[language]) return PHYSICAL_ADJECTIVES[language];
  const baseLanguage = typeof language === "string" ? language.split("-")[0] : null;
  if (baseLanguage && PHYSICAL_ADJECTIVES[baseLanguage]) return PHYSICAL_ADJECTIVES[baseLanguage];
  return PHYSICAL_ADJECTIVES.en;
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

  return [cleanActor, lowercaseFirstLetter(adjective), countSuffix].filter(Boolean).join(" ");
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

  return [remainder, lowercaseFirstLetter(adjective), countSuffix].filter(Boolean).join(" ");
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

function lowercaseFirstLetter(value) {
  if (typeof value !== "string" || value.length === 0) return value;
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}
