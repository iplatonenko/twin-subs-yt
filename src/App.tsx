import { useEffect, useRef, useState } from "react";
import { useDraggable } from "./hooks/useDraggable";

function App() {
  const [words, setWords] = useState<string[]>([]);
  const lastCaptionSnapshot = useRef<string>("");
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const { bind, style } = useDraggable(overlayRef, (el, vw, vh) => {
    const rect = el.getBoundingClientRect();
    const left = Math.round((vw - rect.width) / 2);
    const top = Math.round((vh - rect.height) / 2);
    return { left, top };
  });

  const getCurrentCaptionText = () => {
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

  const tokenize = (text: string) => {
    const m = text.match(/[\p{L}\p{N}’'\-]+/gu);
    return m ?? [];
  };

  useEffect(() => {
    const captionContainer = document.querySelector<HTMLElement>(
      ".ytp-caption-window-container"
    );
    if (captionContainer) {
      captionContainer.style.opacity = "0";
      captionContainer.style.pointerEvents = "none";
    }

    const interval = window.setInterval(() => {
      const txt = getCurrentCaptionText();
      if (!txt || txt === lastCaptionSnapshot.current) return;
      lastCaptionSnapshot.current = txt;

      const tokens = tokenize(txt);
      // уникальные слова в рамках текущего снимка
      const unique = Array.from(new Set(tokens));
      setWords(unique);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={overlayRef}
      {...bind}
      className="custom-captions-overlay"
      style={{
        ...style,
        zIndex: 999999,
        maxWidth: "80vw",
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: "8px 10px",
        background: "rgba(0,0,0,0.55)",
        borderRadius: 8,
        color: "#fff",
        lineHeight: 1.6,
        fontSize: 24,
        fontWeight: 500,
        backdropFilter: "blur(2px)",
        cursor: "grab",
      }}
    >
      {words.map((w, i) => (
        <div
          key={`${w}-${i}`}
          style={{
            display: "inline-block",
            padding: "2px 6px",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.12)",
            userSelect: "text",
            cursor: "default",
          }}
        >
          {w}
        </div>
      ))}
    </div>
  );
}

export default App;
