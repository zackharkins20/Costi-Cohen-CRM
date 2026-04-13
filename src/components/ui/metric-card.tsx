import { GlassCard } from './glass-card'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  change?: string
}

export function MetricCard({ label, value, icon: Icon, change }: MetricCardProps) {
  return (
    <GlassCard hover={false} className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--cc-text-tertiary)]">
            {label}
          </p>
          <p className="text-2xl font-semibold text-[var(--cc-text-primary)] mt-1">{value}</p>
          {change && (
            <p className="text-xs text-[var(--cc-accent)] mt-1">{change}</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-[var(--cc-accent-soft)]">
          <Icon className="h-5 w-5 text-[var(--cc-accent)]" />
        </div>
      </div>
    </GlassCard>
  )
}
