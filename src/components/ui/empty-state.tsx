import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-3 rounded-xl bg-[var(--cc-glass-bg)] border border-[var(--cc-glass-border)] mb-4">
        <Icon className="h-8 w-8 text-[var(--cc-text-muted)]" />
      </div>
      <h3 className="text-lg font-medium text-[var(--cc-text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--cc-text-tertiary)] max-w-sm mb-4">{description}</p>
      {action}
    </div>
  )
}
