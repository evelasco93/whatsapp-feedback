import { DateRange } from "@app-types/api";

type DateRangeControlsProps = {
  value: DateRange;
  onChange: (next: DateRange) => void;
};

export const DateRangeControls = ({
  value,
  onChange,
}: DateRangeControlsProps) => {
  return (
    <div className="date-controls">
      <label>
        Desde
        <input
          type="date"
          value={value.desde}
          onChange={(event) =>
            onChange({ ...value, desde: event.target.value })
          }
        />
      </label>
      <label>
        Hasta
        <input
          type="date"
          value={value.hasta}
          onChange={(event) =>
            onChange({ ...value, hasta: event.target.value })
          }
        />
      </label>
    </div>
  );
};
