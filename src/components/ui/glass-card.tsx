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
        hover && 'hover:border-[var(--cc-glass-hover)] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
