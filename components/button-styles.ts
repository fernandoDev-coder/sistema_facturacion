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
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-md border text-center text-sm font-semibold leading-snug transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none motion-reduce:transform-none";

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
  sm: "min-h-10 px-3 py-2",
  md: "min-h-11 px-4 py-2.5",
  full: "min-h-11 w-full px-4 py-2.5",
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
