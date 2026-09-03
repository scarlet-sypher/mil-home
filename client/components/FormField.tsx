import { InputHTMLAttributes, ReactNode } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  rightSlot?: ReactNode;
  labelClassName?: string;
};

export function FormField({
  label,
  error,
  rightSlot,
  id,
  className = "",
  labelClassName = "text-slate-700",
  ...props
}: FormFieldProps) {
  const fieldId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className={`text-sm font-medium ${labelClassName}`}>
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${className}`}
          {...props}
        />
        {rightSlot && <div className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</div>}
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
