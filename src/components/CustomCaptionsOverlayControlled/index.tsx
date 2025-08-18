// components/CustomCaptionsOverlay.tsx (фрагмент)
import { useRef, useState } from "react";
import WordChip from "../WordChip";
import "./styles.css";

// Тип кэша переводов
type Tr = { en?: string; ru?: string; loading?: boolean; error?: string };

export default function CustomCaptionsOverlayControlled({
  words,
  ...rest
}: { words: string[] } & React.HTMLAttributes<HTMLDivElement>) {
  const [openWord, setOpenWord] = useState<string | null>(null);
  const [trMap, setTrMap] = useState<Record<string, Tr>>({});
  const controllers = useRef<Record<string, AbortController>>({});

  // заглушка API (поменяешь на реальный вызов)
  const translate = async (word: string, signal: AbortSignal) => {
    // имитируем задержку
    await new Promise((r) => setTimeout(r, 250));
    return { en: word, ru: word }; // потом подставишь реальный перевод
  };

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
      const res = await translate(w, ac.signal);
      setTrMap((m) => ({
        ...m,
        [w]: { en: res.en, ru: res.ru, loading: false },
      }));
    } catch (e: any) {
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
