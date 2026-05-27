import { DateRange, PeriodoFiltro } from "@app-types/api";

type DateRangeControlsProps = {
  periodo: PeriodoFiltro;
  value: DateRange;
  onPeriodoChange: (next: PeriodoFiltro) => void;
  onRangeChange: (next: DateRange) => void;
};

const PERIOD_OPTIONS: Array<{ value: PeriodoFiltro; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "30d", label: "Ultimos 30 dias" },
  { value: "15d", label: "Ultimos 15 dias" },
  { value: "7d", label: "Ultimos 7 dias" },
  { value: "ayer", label: "Ayer" },
  { value: "hoy", label: "Hoy" },
  { value: "rango", label: "Rango personalizado" },
];

export const DateRangeControls = ({
  periodo,
  value,
  onPeriodoChange,
  onRangeChange,
}: DateRangeControlsProps) => {
  const isCustomRange = periodo === "rango";

  return (
    <div className="date-controls">
      <label className="date-control-field">
        Periodo
        <select
          value={periodo}
          onChange={(event) =>
            onPeriodoChange(event.target.value as PeriodoFiltro)
          }
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label
        className={`date-control-field ${isCustomRange ? "" : "is-hidden"}`}
      >
        Desde
        <input
          type="date"
          value={value.desde}
          disabled={!isCustomRange}
          onChange={(event) =>
            onRangeChange({ ...value, desde: event.target.value })
          }
        />
      </label>
      <label
        className={`date-control-field ${isCustomRange ? "" : "is-hidden"}`}
      >
        Hasta
        <input
          type="date"
          value={value.hasta}
          disabled={!isCustomRange}
          onChange={(event) =>
            onRangeChange({ ...value, hasta: event.target.value })
          }
        />
      </label>
    </div>
  );
};
