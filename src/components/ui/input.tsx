import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-[var(--radius-md)] bg-elevated px-3 font-mono text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle",
      "transition-shadow duration-150 ease-out hover:shadow-[var(--shadow-border-hover)]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
