import { GM_getValue, GM_setValue, GM_xmlhttpRequest } from "$";

const STORAGE_KEY = "OPENAI_API_KEY";
export type TranslateOptions = {
  sourceLang?: string; // например 'EL' (Greek)
  targetLang?: string; // например 'EN'
  model?: string; // по умолчанию можно 'gpt-4o-mini'
  temperature?: number; // по умолчанию 0.2
  signal?: AbortSignal; // поддержка отмены
};

// Обязателен только text; всё остальное — опционально.
export async function translateText(
  text: string,
  {
    sourceLang = "EL",
    targetLang = "EN",
    model = "gpt-4o-mini",
    temperature = 0.2,
    signal,
  }: TranslateOptions = {}
): Promise<string> {
  if (!text) return "";

  const apiKey = await ensureApiKey();

  const prompt =
    `Translate the following ${sourceLang} subtitles into concise, natural ${targetLang}.\n` +
    `- Keep it short and child-friendly (Peppa Pig style).\n` +
    `- Return only the translation (no quotes, no notes).\n\n` +
    `Text:\n${text}`;

  const body = JSON.stringify({
    model,
    temperature,
    messages: [
      {
        role: "system",
        content: `You translate ${sourceLang} subtitles into natural, concise ${targetLang} suitable for a kids' show.`,
      },
      { role: "user", content: prompt },
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

  const out = (data?.choices?.[0]?.message?.content ?? "").trim();
  return out;
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
        //logs
        const preview = res.responseText
          ? JSON.parse(res.responseText)
          : undefined;

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
