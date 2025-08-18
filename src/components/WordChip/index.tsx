import "./styles.css";

interface WordChipProps {
  children: string;
}

export default function WordChip({ children }: WordChipProps) {
  return <div className="word-chip">{children}</div>;
}
