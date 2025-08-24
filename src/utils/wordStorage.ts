const STORAGE_KEY = "TWIN_SUBS_YT_WORDS_V1";

export type StoredWord = {
  text: string;
  ru?: string;
  en?: string;
  addedAt: number;
};

export function addWordToLocal(
  text: string,
  ru?: string,
  en?: string
): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr: StoredWord[] = raw ? JSON.parse(raw) : [];

    const key = text.trim().toLowerCase();
    const idx = arr.findIndex((w) => w.text.trim().toLowerCase() === key);
    const now = Date.now();

    if (idx === -1) {
      arr.push({ text, ru, en, addedAt: now });
    } else {
      arr[idx] = {
        ...arr[idx],
        ru: ru ?? arr[idx].ru,
        en: en ?? arr[idx].en,
        addedAt: now,
      };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    return true;
  } catch {
    return false;
  }
}

export function getStoredWords(): StoredWord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredWord[]) : [];
  } catch {
    return [];
  }
}

export function clearStoredWords(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function toCSV(
  words: StoredWord[],
  opts: { definition?: "ru" | "ru_en"; withHeader?: boolean } = {}
): string {
  const { definition = "ru_en", withHeader = false } = opts;
  const esc = (s: string) =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;

  const lines: string[] = [];
  if (withHeader) lines.push("Term,Definition");

  for (const w of words) {
    const term = w.text ?? "";
    const def =
      definition === "ru"
        ? w.ru ?? ""
        : [w.ru, w.en].filter(Boolean).join(" / ");
    lines.push(`${esc(String(term))},${esc(String(def))}`);
  }
  return lines.join("\n");
}
