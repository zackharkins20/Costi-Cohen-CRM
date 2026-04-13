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
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#A0A7AB]">
            {label}
          </p>
          <p className="text-[32px] font-semibold text-white mt-2 tracking-[-0.02em] leading-none">{value}</p>
          {change && (
            <p className="text-xs text-[#A0A7AB] mt-1">{change}</p>
          )}
        </div>
        <div className="p-2.5 border border-[#222222]">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </GlassCard>
  )
}
