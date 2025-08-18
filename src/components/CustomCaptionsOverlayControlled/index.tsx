// components/CustomCaptionsOverlay.tsx (фрагмент)
import { useRef, useState } from "react";
import WordChip from "../WordChip";
import "./styles.css";
import { translateText } from "../../lib/openai";

// Тип кэша переводов
type Tr = { en?: string; ru?: string; loading?: boolean; error?: string };

export default function CustomCaptionsOverlayControlled({
  words,
  ...rest
}: { words: string[] } & React.HTMLAttributes<HTMLDivElement>) {
  const [openWord, setOpenWord] = useState<string | null>(null);
  const [trMap, setTrMap] = useState<Record<string, Tr>>({});
  const controllers = useRef<Record<string, AbortController>>({});

  const ensureTranslation = async (w: string) => {
    // если уже есть (или идёт загрузка) — ничего не делаем
    if (trMap[w]?.en || trMap[w]?.ru || trMap[w]?.loading) return;
    // ставим флаг загрузки
    setTrMap((m) => ({
      ...m,
      [w]: { ...(m[w] ?? {}), loading: true, error: undefined },
    }));

    // отменяем прошлый запрос для этого слова
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

  // при открытии поповера запрашиваем перевод (один раз)
  const handleOpenChange = (word: string, open: boolean) => {
    setOpenWord(open ? word : openWord === word ? null : openWord);
    if (open) ensureTranslation(word);
  };

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
    </div>
  );
}
