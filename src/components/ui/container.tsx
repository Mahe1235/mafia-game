import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps 
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  size?: "default" | "sm" | "md" | "lg" | "xl" | "full" | "compact";
  children: React.ReactNode;
}

export function Container({ 
  className,
  size = "compact",
  children,
  ...props
}: ContainerProps) {
  const sizeClasses = {
    default: "max-w-screen-md",
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    full: "max-w-full",
    compact: "max-w-md",
  };

  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 py-6 sm:py-8",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
} 