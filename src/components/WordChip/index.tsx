import "./styles.css";

interface WordChipProps {
  children: string;
  enText?: string;
  ruText?: string;
}

export default function WordChip({ children, enText, ruText }: WordChipProps) {
  const en = enText ?? children;
  const ru = ruText ?? children;

  return (
    <span className="word-chip-wrapper">
      <span className="word-chip">{children}</span>
      <span className="word-popover" role="tooltip">
        <span className="word-popover__row">
          <span className="word-popover__label">EN:</span>
          <span className="word-popover__value">{en}</span>
        </span>
        <span className="word-popover__row">
          <span className="word-popover__label">RU:</span>
          <span className="word-popover__value">{ru}</span>
        </span>
        {/* позже можно добавить кнопки */}
      </span>
    </span>
  );
}
