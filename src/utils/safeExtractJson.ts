export function safeExtractJson(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw);
  } catch {}

  // cut out the first {...} block
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = raw.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }

  // try to extract JSON from fenced code blocks
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }
  return null;
}
