import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const containerVariants = cva(
  "w-full mx-auto",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-gray-50 to-gray-100",
        dark: "bg-gradient-mafia",
        light: "bg-background",
        transparent: "bg-transparent",
      },
      size: {
        default: "max-w-screen-md",
        sm: "max-w-screen-sm",
        md: "max-w-screen-md",
        lg: "max-w-screen-lg",
        xl: "max-w-screen-xl",
        full: "max-w-full",
        compact: "max-w-md",
      },
      padding: {
        default: "px-4 sm:px-6 py-6 sm:py-8",
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-12",
      },
      animation: {
        none: "",
        fadeIn: "animate-fade-in-up",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "compact",
      padding: "default",
      animation: "fadeIn",
    },
  }
);

export interface ContainerProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  className?: string;
  children: React.ReactNode;
}

export function Container({ 
  className,
  variant,
  size,
  padding,
  animation,
  children,
  ...props
}: ContainerProps) {
  return (
    <div className={`min-h-screen ${variant === 'transparent' ? '' : 'bg-gradient-to-b from-gray-50 to-gray-100'}`}>
      <div
        className={containerVariants({ variant, size, padding, animation, className })}
        {...props}
      >
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
} 