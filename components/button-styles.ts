export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "print"
  | "ghost";

export type ButtonSize = "sm" | "md" | "full";

const base =
  "inline-flex items-center justify-center rounded-md border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "border-blue-700 bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-500",
  secondary: "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 focus:ring-zinc-400",
  success: "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-emerald-500",
  warning: "border-amber-600 bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400",
  danger: "border-red-700 bg-red-700 text-white hover:bg-red-800 focus:ring-red-500",
  print: "border-indigo-700 bg-indigo-700 text-white hover:bg-indigo-800 focus:ring-indigo-500",
  ghost: "border-transparent bg-transparent text-zinc-700 hover:bg-zinc-100 focus:ring-zinc-400",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3",
  md: "h-10 px-4",
  full: "h-10 w-full px-4",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}
