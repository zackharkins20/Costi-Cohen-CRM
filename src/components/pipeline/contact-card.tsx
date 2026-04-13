'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { getAssetTypeColor } from '@/lib/stage-colors'
import { useTheme } from '@/components/theme-provider'
import type { Contact } from '@/lib/types'

interface ContactCardProps {
  contact: Contact
  onClick: () => void
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const { theme } = useTheme()
  const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null
    const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (min) return `From ${fmt(min)}`
    if (max) return `Up to ${fmt(max)}`
    return null
  }

  const budget = formatBudget(contact.budget_min, contact.budget_max)

  return (
    <GlassCard className="p-3" onClick={onClick}>
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 bg-cc-surface-2 border border-cc-border flex items-center justify-center text-cc-text-primary text-xs font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-cc-text-primary truncate">{contact.name}</p>
          {contact.company && (
            <p className="text-xs text-cc-text-secondary truncate">{contact.company}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {contact.asset_type && (() => {
              const atc = getAssetTypeColor(contact.asset_type, theme === 'dark')
              return (
                <span className="text-[10px] px-1.5 py-0.5 font-medium rounded-sm" style={{ backgroundColor: atc.bg, color: atc.text }}>
                  {contact.asset_type}
                </span>
              )
            })()}
            {budget && (
              <span className="text-[10px] text-cc-text-primary font-medium">{budget}</span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
