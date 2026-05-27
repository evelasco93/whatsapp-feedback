import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ConteoBucket } from "@app-types/api";
import { SENTIMENT_COLORS } from "@utils/chartColors";

type SentimentPieChartProps = {
  items: ConteoBucket[];
};

const LABELS: Record<string, string> = {
  positivo: "Positivo",
  neutro: "Neutro",
  negativo: "Negativo",
};

export const SentimentPieChart = ({ items }: SentimentPieChartProps) => {
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
          >
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={SENTIMENT_COLORS[entry.key] ?? "#8f8178"}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${String(value ?? 0)}`, "Mensajes"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="legend-row">
        {data.map((entry) => (
          <div className="legend-item" key={entry.key}>
            <span
              className="legend-dot"
              style={{
                backgroundColor: SENTIMENT_COLORS[entry.key] ?? "#8f8178",
              }}
            />
            <span>{entry.name}</span>
            <strong>{entry.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};
