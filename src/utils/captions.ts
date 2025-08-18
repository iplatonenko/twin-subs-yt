export const getCurrentCaptionText = () => {
  const segs = Array.from(
    document.querySelectorAll<HTMLElement>(".ytp-caption-segment")
  );
  if (segs.length > 0)
    return segs
      .map((el) => el.textContent ?? "")
      .join(" ")
      .trim();

  const fallback = document.querySelector<HTMLElement>(".captions-text");
  return (fallback?.textContent ?? "").trim();
};

export const tokenize = (text: string) =>
  text.match(/[\p{L}\p{N}’'\-]+/gu) ?? [];
