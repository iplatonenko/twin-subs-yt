import { useEffect, useRef, useState } from "react";
import { useDraggable } from "./hooks/useDraggable";
import { getCurrentCaptionText, tokenize } from "./utils/captions";
import CustomCaptionsOverlay from "./components/CustomCaptionsOverlay";
import WordChip from "./components/WordChip";
import CustomCaptionsOverlayControlled from "./components/CustomCaptionsOverlayControlled";

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

  useEffect(() => {
    // скрыть стандартные сабы YouTube
    const captionContainer = document.querySelector<HTMLElement>(
      ".ytp-caption-window-container"
    );
    if (captionContainer) {
      captionContainer.style.opacity = "0";
      captionContainer.style.pointerEvents = "none";
    }

    // polling каждые 500 мс
    const interval = window.setInterval(() => {
      const txt = getCurrentCaptionText();
      if (!txt || txt === lastCaptionSnapshot.current) return;
      lastCaptionSnapshot.current = txt;

      const tokens = tokenize(txt);
      setWords(Array.from(new Set(tokens))); // уникальные слова текущего снимка
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <CustomCaptionsOverlay ref={overlayRef} {...bind} overlayStyle={style}>
      <CustomCaptionsOverlayControlled words={words} />
    </CustomCaptionsOverlay>
  );
}

export default App;
