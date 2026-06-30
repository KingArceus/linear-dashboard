interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  disabled?: boolean;
}

export function DateRangePicker({ from, to, onFromChange, onToChange, disabled }: DateRangePickerProps) {
  return (
    <>
      <div className="control">
        <label htmlFor="from-date">From</label>
        <input
          id="from-date"
          type="date"
          value={from}
          disabled={disabled}
          onChange={event => onFromChange(event.target.value)}
        />
      </div>
      <div className="control">
        <label htmlFor="to-date">To</label>
        <input
          id="to-date"
          type="date"
          value={to}
          disabled={disabled}
          onChange={event => onToChange(event.target.value)}
        />
      </div>
    </>
  );
}
