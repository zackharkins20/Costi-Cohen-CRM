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
    <GlassCard hover={false} className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--cc-text-muted)]">
            {label}
          </p>
          <p className="text-2xl font-semibold text-[var(--cc-gold)] mt-2" style={{ fontFamily: "var(--font-heading), 'Cormorant Garamond', serif" }}>{value}</p>
          {change && (
            <p className="text-xs text-[var(--cc-text-tertiary)] mt-1">{change}</p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-[var(--cc-gold-soft)]">
          <Icon className="h-5 w-5 text-[var(--cc-gold)]" />
        </div>
      </div>
    </GlassCard>
  )
}
