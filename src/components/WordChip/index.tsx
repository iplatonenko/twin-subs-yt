import "./styles.css";

interface WordChipProps {
  text: string;

  // контролируемое открытие поповера
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // данные для поповера
  enText?: string;
  ruText?: string;
  loading?: boolean; // показать спиннер/скелетон, пока ждём перевод

  // задержка "намерения" (чтобы не дёргать API при случайном ховере)
  hoverOpenDelayMs?: number;
  hoverCloseDelayMs?: number;
}

export default function WordChip({
  text,
  open,
  onOpenChange,
  enText,
  ruText,
  loading,
  hoverOpenDelayMs = 120,
  hoverCloseDelayMs = 120,
}: WordChipProps) {
  const show = !!open;

  let openTimer: number | undefined;
  let closeTimer: number | undefined;

  const schedule = (next: boolean, delay: number) => {
    if (next) {
      window.clearTimeout(closeTimer);
      openTimer = window.setTimeout(() => onOpenChange?.(true), delay);
    } else {
      window.clearTimeout(openTimer);
      closeTimer = window.setTimeout(() => onOpenChange?.(false), delay);
    }
  };

  const handleEnter = () => schedule(true, hoverOpenDelayMs);
  const handleLeave = () => schedule(false, hoverCloseDelayMs);

  return (
    <span
      className="word-chip-wrapper"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={() => onOpenChange?.(true)}
      onBlur={() => onOpenChange?.(false)}
    >
      <span className="word-chip" tabIndex={0}>
        {text}
      </span>

      <span className={`word-popover ${show ? "is-open" : ""}`} role="tooltip">
        <div className="word-popover__row">
          <span className="word-popover__label">EN</span>
          <span className="word-popover__value">
            {loading ? "…" : enText ?? text}
          </span>
        </div>
        <div className="word-popover__row">
          <span className="word-popover__label">RU</span>
          <span className="word-popover__value">
            {loading ? "…" : ruText ?? text}
          </span>
        </div>
        {/* тут потом добавим кнопки */}
      </span>
    </span>
  );
}
