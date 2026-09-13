import catalogData from "./data/catalog.json";
export type Category = "perk" | "item" | "addon" | "offering";
export type Entry = { id: string; key: string; category: Category; name: string; description: string; role: string; rarity: string | null; itemType: string | null; retired: boolean; icon: string | null };
export type Question = { category: Category; answer: Entry; options: Entry[] };

export const CATEGORY_META: Record<Category, { label: string; prompt: string }> = {
  perk: { label: "Perk", prompt: "What does this perk do?" },
  item: { label: "Item", prompt: "What does this item do?" },
  addon: { label: "Add-on", prompt: "What does this add-on do?" },
  offering: { label: "Offering", prompt: "What does this offering do?" },
};
export const CATEGORIES = Object.keys(CATEGORY_META) as Category[];
const LAUNCH_DATE = "2026-09-12";

function nzDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function dayNumber(date = new Date()) {
  const [year, month, day] = nzDateString(date).split("-").map(Number);
  const [launchYear, launchMonth, launchDay] = LAUNCH_DATE.split("-").map(Number);
  return Math.max(1, Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(launchYear, launchMonth - 1, launchDay)) / 86_400_000) + 1);
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) { result ^= value.charCodeAt(index); result = Math.imul(result, 16777619); }
  return result >>> 0;
}

function seededShuffle<T>(items: T[], seed: number) {
  const output = [...items];
  let state = seed || 1;
  const random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4_294_967_296; };
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

export function makeQuestions(number: number): Question[] {
  return CATEGORIES.map((category, categoryIndex) => {
    const fullPool = (catalogData[category] as Entry[]).filter((entry) => entry.icon);
    const activePool = fullPool.filter((entry) => !entry.retired);
    const pool = activePool.length >= 4 ? activePool : fullPool;
    const answer = pool[((number - 1) * 7 + hash(category) + categoryIndex * 19) % pool.length];
    const peers = pool.filter((entry) => entry.id !== answer.id && entry.description !== answer.description && ((category === "perk" || category === "addon") ? entry.role === answer.role : true));
    const distractors = seededShuffle(peers, hash(`${category}-${number}-options`)).slice(0, 3);
    return { category, answer, options: seededShuffle([answer, ...distractors], hash(`${category}-${number}-order`)) };
  });
}

