import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-3 rounded-xl bg-[var(--cc-surface-2)] border border-[var(--cc-border)] mb-4">
        <Icon className="h-8 w-8 text-[var(--cc-text-muted)]" />
      </div>
      <h3 className="text-lg font-medium text-[var(--cc-text-primary)] mb-1" style={{ fontFamily: "var(--font-heading), 'Cormorant Garamond', serif" }}>{title}</h3>
      <p className="text-sm text-[var(--cc-text-tertiary)] max-w-sm mb-6">{description}</p>
      {action}
    </div>
  )
}
