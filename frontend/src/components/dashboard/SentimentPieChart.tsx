import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ConteoBucket, Sentimiento } from "@app-types/api";
import { SENTIMENT_COLORS } from "@utils/chartColors";

type SentimentPieChartProps = {
  items: ConteoBucket[];
  activeKey?: Sentimiento;
  onSelect?: (key: Sentimiento) => void;
};

const LABELS: Record<string, string> = {
  positivo: "Positivo",
  neutro: "Neutro",
  negativo: "Negativo",
};

const SENTIMIENTO_KEYS: Sentimiento[] = ["positivo", "negativo", "neutro"];

export const SentimentPieChart = ({
  items,
  activeKey,
  onSelect,
}: SentimentPieChartProps) => {
  const sentimentOrder: Record<string, number> = {
    positivo: 0,
    negativo: 1,
    neutro: 2,
  };

  const data = [...items]
    .sort((a, b) => {
      const orderA = sentimentOrder[a.valor] ?? 99;
      const orderB = sentimentOrder[b.valor] ?? 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.valor.localeCompare(b.valor, "es");
    })
    .map((item) => ({
      name: LABELS[item.valor] ?? item.valor,
      value: item.total,
      key: item.valor,
    }));

  const total = data.reduce((acc, entry) => acc + entry.value, 0);
  const toPct = (value: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0;

  const isSentimiento = (key: string): key is Sentimiento =>
    (SENTIMIENTO_KEYS as string[]).includes(key);

  const handleSelect = (key: string) => {
    if (!onSelect || !isSentimiento(key)) {
      return;
    }
    onSelect(key);
  };

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={98}
            dataKey="value"
            nameKey="name"
            paddingAngle={3}
            animationDuration={900}
            animationBegin={120}
            label={({ value, cx, cy, midAngle, innerRadius, outerRadius }) => {
              const numericValue = Number(value ?? 0);
              const pct = toPct(numericValue);
              if (pct < 4) {
                return null;
              }
              const RAD = Math.PI / 180;
              const mid = Number(midAngle ?? 0);
              const inner = Number(innerRadius ?? 0);
              const outer = Number(outerRadius ?? 0);
              const cxNum = Number(cx ?? 0);
              const cyNum = Number(cy ?? 0);
              const r = inner + (outer - inner) * 0.55;
              const x = cxNum + r * Math.cos(-mid * RAD);
              const y = cyNum + r * Math.sin(-mid * RAD);
              return (
                <text
                  x={x}
                  y={y}
                  fill="#ffffff"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    pointerEvents: "none",
                    textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                  }}
                >
                  {pct}%
                </text>
              );
            }}
            labelLine={false}
          >
            {data.map((entry) => {
              const dimmed = Boolean(activeKey) && activeKey !== entry.key;
              return (
                <Cell
                  key={entry.key}
                  fill={SENTIMENT_COLORS[entry.key] ?? "#8f8178"}
                  fillOpacity={dimmed ? 0.35 : 1}
                  stroke="none"
                  style={{
                    cursor: onSelect ? "pointer" : "default",
                    outline: "none",
                  }}
                  onClick={() => handleSelect(entry.key)}
                />
              );
            })}
          </Pie>
          <Tooltip
            formatter={(value) => [
              `${String(value ?? 0)} (${toPct(Number(value ?? 0))}%)`,
              "Mensajes",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="legend-row">
        {data.map((entry) => {
          const isActive = activeKey === entry.key;
          return (
            <button
              type="button"
              key={entry.key}
              className={`legend-item legend-item-button${
                isActive ? " is-active" : ""
              }`}
              onClick={() => handleSelect(entry.key)}
              disabled={!onSelect}
            >
              <span
                className="legend-dot"
                style={{
                  backgroundColor: SENTIMENT_COLORS[entry.key] ?? "#8f8178",
                }}
              />
              <span>{entry.name}</span>
              <strong>{entry.value}</strong>
            </button>
          );
        })}
      </div>
    </div>
  );
};
