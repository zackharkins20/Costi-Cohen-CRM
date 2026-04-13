import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function GlassCard({ className, hover = true, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass-card p-4 transition-all duration-200',
        hover && 'hover:border-cc-border-hover hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
