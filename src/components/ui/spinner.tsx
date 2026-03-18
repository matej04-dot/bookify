import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

type SpinnerProps = {
  label?: string;
  size?: SpinnerSize;
  className?: string;
  containerClassName?: string;
};

const sizeClassMap: Record<SpinnerSize, string> = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

export function Spinner({
  label,
  size = "md",
  className,
  containerClassName,
}: SpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        containerClassName,
      )}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-blue-600 border-r-transparent",
          sizeClassMap[size],
          className,
        )}
        aria-hidden="true"
      />
      {label ? <p className="mt-3 text-sm text-gray-600">{label}</p> : null}
    </div>
  );
}
