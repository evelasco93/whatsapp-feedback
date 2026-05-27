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
  return (
    <div className="date-controls">
      <label>
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
      {periodo === "rango" ? (
        <>
          <label>
            Desde
            <input
              type="date"
              value={value.desde}
              onChange={(event) =>
                onRangeChange({ ...value, desde: event.target.value })
              }
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={value.hasta}
              onChange={(event) =>
                onRangeChange({ ...value, hasta: event.target.value })
              }
            />
          </label>
        </>
      ) : null}
    </div>
  );
};
