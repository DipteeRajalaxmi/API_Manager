import {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

const fieldBase = `
  w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800
  placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100
  transition-all
`;

interface FieldProps { label?: string; error?: string; }

export function Input({
  label, error, className = "", ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
      <input className={`${fieldBase} ${error ? "border-red-400 focus:ring-red-100" : ""} ${className}`} {...props} />
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

export function Select({
  label, error, children, className = "", ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
      <select className={`${fieldBase} ${error ? "border-red-400" : ""} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

export function Textarea({
  label, error, rows = 3, className = "", ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { rows?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
      <textarea rows={rows} className={`${fieldBase} resize-none ${error ? "border-red-400" : ""} ${className}`} {...props} />
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  children, variant = "primary", className = "", ...props
}: { children: ReactNode; variant?: ButtonVariant; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<ButtonVariant, string> = {
    primary:   "grad-teal text-white shadow-md shadow-teal-200 hover:opacity-90",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger:    "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    ghost:     "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
  };
  return (
    <button
      className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
        disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}