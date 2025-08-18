import { GM_getValue, GM_setValue, GM_xmlhttpRequest } from "$";
import { safeExtractJson } from "../utils/safeExtractJson";

const STORAGE_KEY = "OPENAI_API_KEY";

export type TranslateOptions = {
  sourceLang?: string; // исходный язык, напр. 'EL'
  targetLangs?: string[]; // массив целевых языков, напр. ['RU','EN']
  model?: string; // по умолчанию 'gpt-4o-mini'
  temperature?: number; // по умолчанию 0.2
  signal?: AbortSignal; // поддержка отмены
};

export type TranslateResult = Record<string, string>; // { RU: "...", EN: "..." }

// Обязателен только text; всё остальное — опционально.
export async function translateText(
  text: string,
  {
    sourceLang = "EL",
    targetLangs = ["RU", "EN"],
    model = "gpt-4o-mini",
    temperature = 0.2,
    signal,
  }: TranslateOptions = {}
): Promise<TranslateResult> {
  if (!text)
    return Object.fromEntries(
      targetLangs.map((l) => [l, ""])
    ) as TranslateResult;

  const apiKey = await ensureApiKey();

  // Чётко требуем минифицированный JSON без "фантика"
  const langsList = targetLangs.join(", ");
  const shape = `{${targetLangs.map((l) => `"${l}": ""`).join(",")}}`;

  const system = [
    `You are a precise translation engine.`,
    `Given a source subtitle text in ${sourceLang}, you MUST return a JSON string with translations for these languages: [${langsList}].`,
    `Output rules:`,
    `- Output ONLY a minified JSON string (no markdown, no code fences, no extra text).`,
    `- Keys MUST be exactly ${JSON.stringify(targetLangs)}.`,
    `- Values MUST be strings.`,
    `- Keep it concise, natural, child-friendly.`,
    `- If something is untranslatable, repeat the source text.`,
  ].join("\n");

  const user = [
    `Translate the following ${sourceLang} subtitles.`,
    `Return ONLY a JSON string of the form: ${shape}`,
    ``,
    `Text:`,
    text,
  ].join("\n");

  const body = JSON.stringify({
    model,
    temperature,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const data = await gmFetchJson<any>(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      data: body,
      signal,
      timeout: 30000,
    }
  );

  const content = (data?.choices?.[0]?.message?.content ?? "").trim();

  // Парсим и валидируем JSON даже если модель вернёт "фантик"
  const obj = safeExtractJson(content);
  const result: TranslateResult = {} as TranslateResult;

  for (const lang of targetLangs) {
    const v = obj && typeof obj[lang] === "string" ? obj[lang] : text;
    result[lang] = String(v ?? text).trim();
  }

  return result;
}

// Хранение ключа в Tampermonkey Storage
export async function ensureApiKey(): Promise<string> {
  const stored: string | undefined = await GM_getValue(STORAGE_KEY);
  if (stored && stored.trim().length > 12) return stored.trim();

  // простейший ввод ключа
  const key = window.prompt(
    "Enter your OpenAI API key (stored locally in Tampermonkey):",
    ""
  );
  if (!key) throw new Error("No API key provided");
  const normalized = key.trim();
  await GM_setValue(STORAGE_KEY, normalized);
  return normalized;
}

// Опционально: сбросить ключ из настроек/кнопки
export async function clearApiKey(): Promise<void> {
  await GM_setValue(STORAGE_KEY, "");
}

// Обёртка над GM_xmlhttpRequest c поддержкой AbortSignal и JSON
function gmFetchJson<T>(
  url: string,
  opts: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    data?: string;
    timeout?: number;
    signal?: AbortSignal;
  }
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // logs
    const __headersForLog = opts.headers ? { ...opts.headers } : undefined;
    if (
      __headersForLog &&
      (__headersForLog.Authorization || (__headersForLog as any).authorization)
    ) {
      const raw = (__headersForLog.Authorization ??
        (__headersForLog as any).authorization) as string;
      const tail = raw?.startsWith("Bearer ") ? raw.slice(-4) : "";
      __headersForLog.Authorization = `Bearer ***${tail}`;
      (__headersForLog as any).authorization = __headersForLog.Authorization;
    }
    console.log("[GM] →", opts.method, url, {
      headers: __headersForLog,
      bodyPreview: opts.data ? JSON.parse(opts.data) : undefined,
    });

    const req = GM_xmlhttpRequest({
      url,
      method: opts.method,
      headers: opts.headers,
      data: opts.data,
      timeout: opts.timeout ?? 30000,
      onload: (res) => {
        let preview: unknown = undefined;
        try {
          preview = JSON.parse(res.responseText);
        } catch {
          preview = res.responseText?.slice(0, 200);
        }

        console.log("[GM] ←", res.status, url, {
          bodyPreview: preview,
          length: res.responseText?.length ?? 0,
        });

        try {
          if (res.status < 200 || res.status >= 300) {
            reject(
              new Error(
                `HTTP ${res.status}: ${res.responseText || res.statusText}`
              )
            );
            return;
          }
          const json = JSON.parse(res.responseText || "{}") as T;
          resolve(json);
        } catch (e) {
          reject(e);
        }
      },
      onerror: (e) => {
        console.log("[GM] ✖ network error", url, e);
        reject(new Error("Network error"));
      },
      ontimeout: () => {
        console.log("[GM] ⏱ timeout", url, opts.timeout ?? 30000);
        reject(new Error("Request timed out"));
      },
    });

    // поддержка отмены
    if (opts.signal) {
      if (opts.signal.aborted) {
        try {
          req.abort();
        } catch {}
        return reject(new Error("Aborted"));
      }
      const onAbort = () => {
        try {
          req.abort();
        } catch {}
        reject(new Error("Aborted"));
      };
      opts.signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
