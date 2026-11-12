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
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-md border text-center text-sm font-semibold leading-snug transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 motion-reduce:transform-none";

const variants: Record<ButtonVariant, string> = {
  primary: "border-blue-700 bg-blue-700 text-white hover:bg-blue-800",
  secondary: "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100",
  success: "border-blue-700 bg-blue-700 text-white hover:bg-blue-800",
  warning: "border-blue-700 bg-blue-700 text-white hover:bg-blue-800",
  danger: "border-red-700 bg-red-700 text-white hover:bg-red-800",
  print: "border-blue-700 bg-blue-700 text-white hover:bg-blue-800",
  ghost: "border-transparent bg-transparent text-zinc-700 hover:bg-zinc-100",
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
