const hashText = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const TOPIC_MUTED_COLORS = [
  "#5f8152",
  "#7d562d",
  "#6f875f",
  "#8a6a4d",
  "#6b7e61",
  "#9a7c62",
  "#708b7c",
  "#886f55",
  "#7e9566",
  "#8e7659",
];

const hexToRgb = (hex: string) => {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) {
    return null;
  }
  const value = Number.parseInt(cleaned, 16);
  if (Number.isNaN(value)) {
    return null;
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

export const getTopicPalette = (label: string) => {
  const hash = hashText(label);
  const bar = TOPIC_MUTED_COLORS[hash % TOPIC_MUTED_COLORS.length];
  const rgb = hexToRgb(bar);
  const chipBg = rgb
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`
    : "rgba(125, 86, 45, 0.22)";

  return {
    bar,
    chipBg,
    chipText: bar,
  };
};

export const SENTIMENT_COLORS: Record<string, string> = {
  positivo: "var(--sentiment-positive)",
  negativo: "var(--sentiment-negative)",
  neutro: "var(--sentiment-neutral)",
};
