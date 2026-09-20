import { cleanDescription } from "./description.mjs";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

const sources = {
  perk: "/tmp/perks.json",
  item: "/tmp/items.json",
  addon: "/tmp/addons.json",
  offering: "/tmp/offerings.json",
};

const assetRoots = {
  perk: "/tmp/DBDImages/images/perks",
  item: "/tmp/DBDImages/images/items",
  addon: "/tmp/DBDImages/images/addons",
  offering: "/tmp/DBDImages/images/offerings",
};

const outRoot = new URL("../public/icons/", import.meta.url).pathname;
const dataFile = new URL("../app/data/catalog.json", import.meta.url).pathname;

const normalize = (value = "") => value
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[’'`]/g, "")
  .replace(/&/g, "and")
  .replace(/[^a-z0-9]/g, "");

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});

function imageHints(key, record) {
  const rawImage = basename(record.image || "", extname(record.image || ""));
  const stripped = rawImage
    .replace(/^icon(perks?|addon|favors?|items?|itemaddons?)/i, "")
    .replace(/^icon_/i, "");
  return [record.name, stripped, key]
    .map(normalize)
    .filter(Boolean);
}

function assetIndex(root) {
  const map = new Map();
  for (const file of walk(root).filter((path) => /\.(png|webp|jpe?g)$/i.test(path))) {
    const name = normalize(basename(file, extname(file)));
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(file);
  }
  return map;
}

mkdirSync(new URL("../app/data/", import.meta.url), { recursive: true });
mkdirSync(outRoot, { recursive: true });

const catalog = {};
const report = {};

for (const [category, source] of Object.entries(sources)) {
  if (!existsSync(source)) throw new Error(`Missing source: ${source}`);
  const raw = JSON.parse(readFileSync(source, "utf8"));
  const index = assetIndex(assetRoots[category]);
  const outputDir = join(outRoot, category);
  mkdirSync(outputDir, { recursive: true });
  let matched = 0;

  catalog[category] = Object.entries(raw)
    .filter(([, record]) => record && record.name && record.description)
    .map(([key, record]) => {
      const candidates = imageHints(key, record).flatMap((hint) => index.get(hint) || []);
      const sourceIcon = candidates[0] || null;
      const safeId = normalize(key) || normalize(record.name);
      let icon = null;
      if (sourceIcon) {
        const outputFile = join(outputDir, `${safeId}.webp`);
        if (!existsSync(outputFile) || statSync(outputFile).mtimeMs < statSync(sourceIcon).mtimeMs) {
          execFileSync("convert", [sourceIcon, "-resize", "256x256>", "-strip", "-quality", "78", outputFile]);
        }
        icon = `/icons/${category}/${safeId}.webp`;
        matched += 1;
      }

      return {
        id: `${category}-${safeId}`,
        key,
        category,
        name: record.name,
        description: cleanDescription(record.description, record),
        ...(category === "perk" ? { tier: 3 } : {}),
        role: record.role || "general",
        rarity: record.rarity || null,
        itemType: record.item_type || null,
        retired: Boolean(record.retired),
        icon,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  report[category] = { total: catalog[category].length, matched };
}

writeFileSync(dataFile, JSON.stringify({
  snapshot: "2026-09-12",
  source: "Dead by Daylight live game catalogue, cross-checked against the Official Dead by Daylight Wiki",
  ...catalog,
}));

console.log(JSON.stringify(report, null, 2));
