import { useRef, useState } from "react";
import WordChip from "../WordChip";
import "./styles.css";
import { translateText } from "../../lib/openai";

type Tr = { en?: string; ru?: string; loading?: boolean; error?: string };

export default function CustomCaptionsOverlayControlled({
  words,
  ...rest
}: { words: string[] } & React.HTMLAttributes<HTMLDivElement>) {
  const [openWord, setOpenWord] = useState<string | null>(null);
  const [trMap, setTrMap] = useState<Record<string, Tr>>({});
  const controllers = useRef<Record<string, AbortController>>({});

  const ensureTranslation = async (w: string) => {
    const isExist = trMap[w]?.en || trMap[w]?.ru || trMap[w]?.loading;

    if (isExist) return;

    setTrMap((m) => ({
      ...m,
      [w]: { ...(m[w] ?? {}), loading: true, error: undefined },
    }));

    controllers.current[w]?.abort();
    const ac = new AbortController();
    controllers.current[w] = ac;

    try {
      const res = await translateText(w, {
        sourceLang: "EL",
        targetLangs: ["EN", "RU"],
        signal: ac.signal,
      });
      setTrMap((m) => ({
        ...m,
        [w]: { en: res.EN, ru: res.RU, loading: false },
      }));
    } catch {
      if (ac.signal.aborted) return;
      setTrMap((m) => ({
        ...m,
        [w]: { ...(m[w] ?? {}), loading: false, error: "fail" },
      }));
    }
  };

  const handleOpenChange = (word: string, open: boolean) => {
    setOpenWord(open ? word : openWord === word ? null : openWord);
    if (open) ensureTranslation(word);
  };

  const sentence = words.join(" ");
  const sentenceOpen = openWord === sentence;
  const sentenceTr = trMap[sentence];

  return (
    <div className="custom-captions-overlay-controlled" {...rest}>
      {words.map((w, i) => {
        const open = openWord === w;
        const tr = trMap[w];
        return (
          <WordChip
            key={`${w}-${i}`}
            text={w}
            open={open}
            onOpenChange={(o) => handleOpenChange(w, o)}
            enText={tr?.en}
            ruText={tr?.ru}
            loading={tr?.loading}
          />
        );
      })}
      {words.length > 0 && (
        <WordChip
          text={"🪄"}
          actions={false}
          open={sentenceOpen}
          onOpenChange={(o) => handleOpenChange(sentence, o)}
          enText={sentenceTr?.en}
          ruText={sentenceTr?.ru}
          loading={sentenceTr?.loading}
        />
      )}
    </div>
  );
}
