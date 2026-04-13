import { GlassCard } from './glass-card'
import type { LucideIcon } from 'lucide-react'

const accentBorders = [
  'border-t-[3px] border-t-[#1A1F36]',
  'border-t-[3px] border-t-[#4A5568]',
  'border-t-[3px] border-t-[#9BA3AF]',
  'border-t-[3px] border-t-[#6B7C93]',
]

interface MetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  change?: string
  index?: number
}

export function MetricCard({ label, value, icon: Icon, change, index = 0 }: MetricCardProps) {
  return (
    <GlassCard hover={false} className={`p-6 ${accentBorders[index % accentBorders.length]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-cc-text-secondary">
            {label}
          </p>
          <p className="text-[36px] font-bold text-cc-text-primary mt-2 tracking-[-0.03em] leading-none">{value}</p>
          {change && (
            <p className="text-xs text-cc-text-secondary mt-1">{change}</p>
          )}
        </div>
        <div className="p-2.5 border border-cc-border rounded-lg bg-cc-surface-2">
          <Icon className="h-5 w-5 text-cc-text-secondary" />
        </div>
      </div>
    </GlassCard>
  )
}
