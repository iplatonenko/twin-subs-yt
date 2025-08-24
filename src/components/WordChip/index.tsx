import { useState } from "react";
import {
  addWordToLocal,
  clearStoredWords,
  getStoredWords,
  toCSV,
} from "../../utils/wordStorage";
import "./styles.css";

interface WordChipProps {
  text: string;

  actions?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  enText?: string;
  ruText?: string;
  loading?: boolean;

  hoverOpenDelayMs?: number;
  hoverCloseDelayMs?: number;
}

export default function WordChip({
  text,
  actions = true,
  open,
  onOpenChange,
  enText,
  ruText,
  loading,
  hoverOpenDelayMs = 120,
  hoverCloseDelayMs = 120,
}: WordChipProps) {
  const [addedTick, setAddedTick] = useState(false);
  const [copiedTick, setCopiedTick] = useState(false);
  const [deletedTick, setDeletedTick] = useState(false);

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

  const handleAdd = () => {
    const ok = addWordToLocal(text, ruText, enText);
    if (ok) {
      setAddedTick(true);
      window.setTimeout(() => setAddedTick(false), 1000);
    }
  };

  const handleCopyAll = async () => {
    const csv = toCSV(getStoredWords());
    await navigator.clipboard.writeText(csv);

    setCopiedTick(true);
    window.setTimeout(() => setCopiedTick(false), 1000);
  };

  const handleDeleteAll = async () => {
    clearStoredWords();

    setDeletedTick(true);
    window.setTimeout(() => setDeletedTick(false), 1000);
  };

  const handleEnter = () => schedule(true, hoverOpenDelayMs);
  const handleLeave = () => schedule(false, hoverCloseDelayMs);

  const show = !!open;
  const en = enText ?? text;
  const ru = ruText ?? text;

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

      <span
        className={`word-popover ${show ? "is-open" : ""}`}
        role="tooltip"
        data-no-drag
      >
        <div className="word-popover__rows">
          {actions && (
            <div className="word-popover__actions">
              <button
                type="button"
                className="word-popover__btn"
                onClick={handleAdd}
                title="Добавить в список"
              >
                {addedTick ? "✔️" : "+"}
              </button>
              <button
                type="button"
                className="word-popover__btn"
                onClick={handleCopyAll}
                title="Скопировать список в буфер (CSV)"
              >
                {copiedTick ? "✔️" : "📋"}
              </button>
              <button
                type="button"
                className="word-popover__btn"
                onClick={handleDeleteAll}
                title="Очистить список"
              >
                {deletedTick ? "✔️" : "🗑️"}
              </button>
            </div>
          )}

          <div className="word-popover__row">
            <span className="word-popover__label">EN:</span>
            <span className="word-popover__value">{loading ? "…" : en}</span>
          </div>
          <div className="word-popover__row">
            <span className="word-popover__label">RU:</span>
            <span className="word-popover__value">{loading ? "…" : ru}</span>
          </div>
        </div>
      </span>
    </span>
  );
}
