import { gmFetchJson } from "../../utils/gmFetchJson";
import { ensureApiKey } from "./utils";

export type TranslateOptions = {
  sourceLang?: string;
  targetLangs?: string[];
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
};

export type TranslateResult = Record<string, string>;

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

  const apiKey = ensureApiKey();

  const schemaProps = Object.fromEntries(
    targetLangs.map((l) => [l, { type: "string" }])
  );
  const jsonSchema = {
    name: "translations",
    schema: {
      type: "object",
      additionalProperties: false,
      required: targetLangs,
      properties: schemaProps,
    },
    strict: true,
  };

  const messages = [
    {
      role: "system",
      content:
        "You are a precise translation engine. Translate the text from one language to multiple target languages without adding any extra information or commentary. Keep it concise, natural, child-friendly.",
    },
    {
      role: "user",
      content: `Source language: ${sourceLang}. Target languages: ${targetLangs.join(
        ", "
      )}.`,
    },
    {
      role: "user",
      content: "If something cannot be translated, repeat the source text.",
    },
    { role: "user", content: text },
  ];

  const body = JSON.stringify({
    model,
    temperature,
    messages,
    response_format: { type: "json_schema", json_schema: jsonSchema },
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
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  const result: TranslateResult = {} as TranslateResult;
  for (const lang of targetLangs) {
    const v = typeof parsed?.[lang] === "string" ? parsed[lang] : text;
    result[lang] = String(v ?? text).trim();
  }
  return result;
}
