import { GM_getValue, GM_setValue } from "$";
import { STORAGE_KEY } from "./constants";

const MIN_KEY_LENGTH = 50;

export function ensureApiKey(): string {
  const stored: string | undefined = GM_getValue(STORAGE_KEY);
  if (stored && stored.trim().length > MIN_KEY_LENGTH) return stored.trim();
  const key = window.prompt(
    "Enter your OpenAI API key (stored locally in Tampermonkey):",
    ""
  );
  if (!key) throw new Error("No API key provided");
  const normalized = key.trim();
  GM_setValue(STORAGE_KEY, normalized);
  return normalized;
}

export function clearApiKey() {
  GM_setValue(STORAGE_KEY, "");
}
