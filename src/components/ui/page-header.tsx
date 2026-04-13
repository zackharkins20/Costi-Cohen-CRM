import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-8', className)}>
      <div>
        <h1 className="text-2xl font-semibold text-[var(--cc-text-primary)]" style={{ fontFamily: "var(--font-heading), 'Cormorant Garamond', serif" }}>{title}</h1>
        {description && (
          <p className="text-sm text-[var(--cc-text-muted)] mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}
