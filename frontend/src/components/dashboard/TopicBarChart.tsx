import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ConteoBucket } from "@app-types/api";
import { getTopicPalette } from "@utils/chartColors";

type TopicBarChartProps = {
  items: ConteoBucket[];
  activeValue?: string;
  onSelect?: (value: string) => void;
};

export const TopicBarChart = ({
  items,
  activeValue,
  onSelect,
}: TopicBarChartProps) => {
  const data = [...items]
    .sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      return a.valor.localeCompare(b.valor, "es");
    })
    .map((item) => ({
      tema: item.valor,
      total: item.total,
    }));

  const colorByTopic = new Map<string, string>();
  data.forEach((entry) => {
    colorByTopic.set(entry.tema, getTopicPalette(entry.tema).bar);
  });
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={290}>
        <BarChart
          data={data}
          margin={{ top: 16, right: 16, left: 0, bottom: 24 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#d8cec6"
          />
          <XAxis
            dataKey="tema"
            tick={{ fontSize: 12, fill: "#4f4540" }}
            angle={-15}
            textAnchor="end"
            interval={0}
            height={64}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#4f4540" }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(125, 86, 45, 0.08)" }}
            formatter={(value) => [`${String(value ?? 0)}`, "Mensajes"]}
          />
          <Bar
            dataKey="total"
            radius={[10, 10, 0, 0]}
            animationDuration={1000}
            activeBar={false}
          >
            {data.map((entry) => {
              const dimmed = Boolean(activeValue) && activeValue !== entry.tema;
              return (
                <Cell
                  key={entry.tema}
                  fill={colorByTopic.get(entry.tema) ?? "#7d562d"}
                  fillOpacity={dimmed ? 0.35 : 1}
                  stroke="none"
                  style={{
                    cursor: onSelect ? "pointer" : "default",
                    outline: "none",
                  }}
                  onClick={() => onSelect?.(entry.tema)}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
