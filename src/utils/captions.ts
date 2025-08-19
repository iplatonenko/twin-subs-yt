import { CAPTION_SEGMENT, CAPTIONS_TEXT } from "../constants/ytClasses";

export const getCurrentCaptionText = () => {
  const segs = Array.from(
    document.querySelectorAll<HTMLElement>(CAPTION_SEGMENT)
  );
  if (segs.length > 0)
    return segs
      .map((el) => el.textContent ?? "")
      .join(" ")
      .trim();

  const fallback = document.querySelector<HTMLElement>(CAPTIONS_TEXT);
  return (fallback?.textContent ?? "").trim();
};

export const tokenize = (text: string) =>
  text.match(/[\p{L}\p{N}’'\-]+/gu) ?? [];
