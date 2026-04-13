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
      <div className="p-3 bg-cc-surface border border-cc-border mb-4">
        <Icon className="h-8 w-8 text-cc-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-cc-text-primary mb-1 tracking-[-0.02em]">{title}</h3>
      <p className="text-sm text-cc-text-secondary max-w-sm mb-6">{description}</p>
      {action}
    </div>
  )
}
