import { useEffect, useRef, useState } from "react";
import { useDraggable } from "./hooks/useDraggable";
import { getCurrentCaptionText, tokenize } from "./utils/captions";
import CustomCaptionsOverlay from "./components/CustomCaptionsOverlay";
import CustomCaptionsOverlayControlled from "./components/CustomCaptionsOverlayControlled";
import { CAPTION_WINDOW_CONTAINER } from "./constants/ytClasses";

function App() {
  const [words, setWords] = useState<string[]>([]);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const { bind, style } = useDraggable(overlayRef);

  useEffect(() => {
    // remove captions from the YouTube player
    const captionContainer = document.querySelector<HTMLElement>(
      CAPTION_WINDOW_CONTAINER
    );
    if (captionContainer) {
      captionContainer.style.opacity = "0";
      captionContainer.style.pointerEvents = "none";
    }

    // polling to check caption text changes
    const interval = window.setInterval(() => {
      const txt = getCurrentCaptionText();
      const tokens = tokenize(txt);
      setWords(Array.from(tokens));
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
