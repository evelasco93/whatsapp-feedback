type ChipVariant = "positivo" | "negativo" | "neutro" | "tema" | "default";

type StatChipProps = {
  label: string;
  variant?: ChipVariant;
  active?: boolean;
  onClick?: () => void;
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
}: StatChipProps) => {
  const className =
    `stat-chip ${variantClassMap[variant]} ${active ? "active" : ""}`.trim();

  if (onClick) {
    return (
      <button className={className} onClick={onClick} type="button">
        {label}
      </button>
    );
  }

  return <span className={className}>{label}</span>;
};
