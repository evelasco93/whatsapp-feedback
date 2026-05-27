import { CSSProperties } from "react";
import { getTopicPalette } from "@utils/chartColors";

type ChipVariant = "positivo" | "negativo" | "neutro" | "tema" | "default";

type StatChipProps = {
  label: string;
  variant?: ChipVariant;
  active?: boolean;
  onClick?: () => void;
  toneKey?: string;
};

const variantClassMap: Record<ChipVariant, string> = {
  positivo: "chip-positivo",
  negativo: "chip-negativo",
  neutro: "chip-neutro",
  tema: "chip-tema",
  default: "",
};

export const StatChip = ({
  label,
  variant = "default",
  active = false,
  onClick,
  toneKey,
}: StatChipProps) => {
  const className =
    `stat-chip ${variantClassMap[variant]} ${active ? "active" : ""}`.trim();

  const inlineStyle: CSSProperties | undefined =
    variant === "tema" && toneKey
      ? {
          backgroundColor: getTopicPalette(toneKey).chipBg,
          color: getTopicPalette(toneKey).chipText,
        }
      : undefined;

  if (onClick) {
    return (
      <button
        className={className}
        onClick={onClick}
        style={inlineStyle}
        type="button"
      >
        {label}
      </button>
    );
  }

  return (
    <span className={className} style={inlineStyle}>
      {label}
    </span>
  );
};
