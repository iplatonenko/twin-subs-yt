export function safeExtractJson(raw: string): Record<string, unknown> | null {
  // 1) прямая попытка
  try {
    return JSON.parse(raw);
  } catch {}

  // 2) вырезаем первый {...} блок
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = raw.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }

  // 3) попытка снять код-блоки ```json ... ```
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }
  return null;
}
