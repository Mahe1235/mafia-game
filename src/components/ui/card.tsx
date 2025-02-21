import * as React from "react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border bg-white text-gray-900 shadow-sm ${className}`}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={`flex flex-col space-y-1.5 p-6 ${className}`}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h3
      className={`text-2xl font-semibold leading-none tracking-tight text-gray-900 ${className}`}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: CardProps) {
  return (
    <div className={`p-6 pt-0 text-gray-900 ${className}`} {...props} />
  )
} 