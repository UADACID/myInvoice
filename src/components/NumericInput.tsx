import { useEffect, useState, type InputHTMLAttributes } from 'react';

interface NumericInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'className'> {
  label?: string;
  error?: string;
  className?: string;
  value: number;
  onChange: (value: number) => void;
  allowDecimals?: boolean;
  /** When the field is empty, this numeric value is used internally. */
  emptyValue?: number;
  /** Minimum allowed value applied on blur. */
  min?: number;
}

function formatDisplayValue(value: number, emptyValue: number): string {
  return value === emptyValue ? '' : String(value);
}

function isValidNumericInput(raw: string, allowDecimals: boolean): boolean {
  if (raw === '') return true;
  return allowDecimals ? /^\d*\.?\d*$/.test(raw) : /^\d*$/.test(raw);
}

function parseNumericInput(raw: string, emptyValue: number, allowDecimals: boolean): number {
  if (raw === '' || raw === '.') return emptyValue;
  const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : emptyValue;
}

export function NumericInput({
  label,
  error,
  className = '',
  value,
  onChange,
  allowDecimals = true,
  emptyValue = 0,
  min,
  onBlur,
  onFocus,
  ...props
}: NumericInputProps) {
  const [text, setText] = useState(() => formatDisplayValue(value, emptyValue));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(formatDisplayValue(value, emptyValue));
    }
  }, [value, emptyValue, focused]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (!isValidNumericInput(raw, allowDecimals)) return;
    setText(raw);
    onChange(parseNumericInput(raw, emptyValue, allowDecimals));
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    let normalized = value;
    if (min !== undefined && normalized < min) {
      normalized = min;
      onChange(normalized);
    }
    setText(formatDisplayValue(normalized, emptyValue));
    onBlur?.(event);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2.5">
          {label}
        </label>
      )}
      <input
        type="text"
        inputMode={allowDecimals ? 'decimal' : 'numeric'}
        autoComplete="off"
        className={`w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors bg-[var(--bg-input)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        value={text}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
