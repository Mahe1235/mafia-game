import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-border",
        primary: "border-primary/20",
        secondary: "border-secondary/20",
        ghost: "border-transparent bg-transparent",
      },
      hover: {
        default: "",
        lift: "transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1",
        glow: "transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)]",
      },
      padding: {
        default: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: "default",
      padding: "default",
    },
  }
)

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  className?: string;
}

export function Card({ 
  className, 
  variant, 
  hover, 
  padding,
  ...props 
}: CardProps) {
  return (
    <div
      className={cardVariants({ variant, hover, padding, className })}
      {...props}
    />
  )
}

export function CardHeader({ 
  className, 
  ...props 
}: CardProps) {
  return (
    <div
      className={`flex flex-col space-y-1.5 p-6 ${className}`}
      {...props}
    />
  )
}

export function CardTitle({ 
  className, 
  ...props 
}: CardProps) {
  return (
    <h3
      className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  )
}

export function CardDescription({ 
  className, 
  ...props 
}: CardProps) {
  return (
    <p
      className={`text-sm text-foreground/60 ${className}`}
      {...props}
    />
  )
}

export function CardContent({ 
  className, 
  ...props 
}: CardProps) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props} />
  )
}

export function CardFooter({ 
  className, 
  ...props 
}: CardProps) {
  return (
    <div
      className={`flex items-center p-6 pt-0 ${className}`}
      {...props}
    />
  )
} 