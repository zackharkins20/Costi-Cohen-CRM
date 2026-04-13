'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MetricCard } from '@/components/ui/metric-card'
import { GlassCard } from '@/components/ui/glass-card'
import { getContacts, getDeals, getRecentActivities } from '@/lib/queries'
import { PROPERTY_STAGES, type Contact, type Deal, type Activity } from '@/lib/types'
import { DollarSign, TrendingUp, Users, CheckCircle, MessageSquare, Pencil, ArrowRightLeft, Phone, Video, Plus, PlusCircle, Mail, FileText } from 'lucide-react'
import { formatLabel } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatDistanceToNow, isAfter, startOfWeek, startOfMonth, startOfYear, subMonths } from 'date-fns'
import { useTheme } from '@/components/theme-provider'

type DatePreset = 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'all_time'

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all_time', label: 'All Time' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'this_quarter', label: 'This Quarter' },
  { key: 'this_year', label: 'This Year' },
]

function getPresetStartDate(preset: DatePreset): Date | null {
  const now = new Date()
  switch (preset) {
    case 'this_week': return startOfWeek(now)
    case 'this_month': return startOfMonth(now)
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3) * 3
      return new Date(now.getFullYear(), q, 1)
    }
    case 'this_year': return startOfYear(now)
    case 'all_time': return null
  }
}

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [datePreset, setDatePreset] = useState<DatePreset>('all_time')
  const { theme } = useTheme()

  useEffect(() => {
    getContacts().then(setContacts)
    getDeals().then(setDeals)
    getRecentActivities(10).then(setActivities)
  }, [])

  const rangeStart = getPresetStartDate(datePreset)

  const inRange = (dateStr: string) => {
    if (!rangeStart) return true
    return isAfter(new Date(dateStr), rangeStart)
  }

  const filteredDeals = deals.filter(d => inRange(d.created_at))
  const filteredContacts = contacts.filter(c => inRange(c.created_at))
  const filteredActivities = activities.filter(a => inRange(a.created_at))

  const pipelineValue = filteredDeals
    .filter(d => d.stage !== 'settled' && d.stage !== 'marketing_only')
    .reduce((sum, d) => sum + (d.deal_value || 0), 0)
  const activeDeals = filteredDeals.filter(d => d.stage !== 'settled' && d.stage !== 'marketing_only').length
  const feesEarned = filteredDeals
    .filter(d => d.stage === 'settled')
    .reduce((sum, d) => sum + (d.fee_amount || 0), 0)

  // Fee summary calculations
  const pendingFees = filteredDeals
    .filter(d => d.stage !== 'settled' && d.stage !== 'marketing_only')
    .reduce((sum, d) => {
      if (!d.deal_value || !d.fee_percentage) return sum
      return sum + (d.deal_value * d.fee_percentage) / 100
    }, 0)
  const collectedFees = filteredDeals
    .filter(d => d.stage === 'settled')
    .reduce((sum, d) => sum + (d.fee_amount || 0), 0)
  const thisMonthStart = startOfMonth(new Date())
  const thisMonthFees = deals
    .filter(d => d.stage === 'settled' && isAfter(new Date(d.updated_at), thisMonthStart))
    .reduce((sum, d) => sum + (d.fee_amount || 0), 0)

  const stageAbbreviations: Record<string, string> = {
    active_leads: 'Active Leads',
    proposal_sent: 'Proposal',
    agreement_sent: 'Agreement',
    agreement_signed: 'Signed',
    retainer_invoice_sent: 'Invoice',
    property_search: 'Search',
    contracts_exchanged: 'Exchanged',
    settled: 'Settled',
    marketing_only: 'Marketing',
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('note')) return FileText
    if (action.includes('stage') || action.includes('status')) return ArrowRightLeft
    if (action.includes('call')) return Phone
    if (action.includes('meeting')) return Video
    if (action.includes('created') || action === 'created') return PlusCircle
    if (action.includes('email')) return Mail
    return MessageSquare
  }

  const chartData = PROPERTY_STAGES.map(stage => ({
    name: stageAbbreviations[stage.key] || stage.label,
    count: (datePreset === 'all_time' ? contacts : filteredContacts).filter(c => c.stage === stage.key).length,
  }))

  const formatCurrency = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
  }

  const isDark = theme === 'dark'

  /* Theme-aware chart palette — blue-grey tones */
  const chartColors = isDark
    ? ['#34D399', '#60A5FA', '#FBBF24', '#FB7185', '#A78BFA', '#22D3EE', '#F97316', '#059669', '#9CA3AF']
    : ['#10B981', '#3B82F6', '#F59E0B', '#FB7185', '#8B5CF6', '#06B6D4', '#F97316', '#059669', '#9CA3AF']
  const chartAxisColor = isDark ? '#555555' : '#8B95A0'
  const chartGridColor = isDark ? '#222222' : '#D8DEE4'
  const chartTooltipBg = isDark ? '#111111' : '#FFFFFF'
  const chartTooltipBorder = isDark ? '#222222' : '#D8DEE4'
  const chartTooltipText = isDark ? '#FFFFFF' : '#000000'

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your pipeline and activity">
        <div className="flex gap-1.5">
          {DATE_PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => setDatePreset(p.key)}
              className={`px-3 py-1.5 text-xs border rounded-md transition-colors whitespace-nowrap ${
                datePreset === p.key
                  ? 'bg-cc-accent text-white border-cc-accent'
                  : 'bg-transparent text-cc-text-secondary border-cc-border hover:border-cc-btn-border hover:text-cc-text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6" data-tour="dashboard-metrics">
        <MetricCard label="Pipeline Value" value={formatCurrency(pipelineValue)} icon={DollarSign} index={0} href="/pipeline" />
        <MetricCard label="Active Deals" value={activeDeals} icon={TrendingUp} index={1} href="/deals" />
        <MetricCard label="Contacts" value={filteredContacts.length} icon={Users} index={2} href="/contacts" />
        <MetricCard label="Fees Earned" value={formatCurrency(feesEarned)} icon={CheckCircle} index={3} href="/deals" />
      </div>

      {/* Fee Summary Row */}
      <GlassCard hover={false} className="p-4 mb-10">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-cc-text-muted uppercase tracking-[0.04em]">Fee Summary</h3>
        </div>
        <div className="grid grid-cols-3 gap-6 mt-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-cc-text-muted">Pending Fees</p>
            <p className="text-xl font-bold text-cc-text-primary mt-1">{formatCurrency(pendingFees)}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-cc-text-muted">Collected Fees</p>
            <p className="text-xl font-bold text-cc-text-primary mt-1">{formatCurrency(collectedFees)}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-cc-text-muted">This Month</p>
            <p className="text-xl font-bold text-cc-text-primary mt-1">{formatCurrency(thisMonthFees)}</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline chart */}
        <GlassCard hover={false} className="lg:col-span-2 p-6">
          <h3 className="text-[13px] font-semibold text-cc-text-primary mb-5 uppercase tracking-[0.04em]">Pipeline by Stage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartAxisColor, fontSize: 10 }}
                  axisLine={{ stroke: chartGridColor }}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: chartAxisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  label={{ value: 'Deal Count', angle: -90, position: 'insideLeft', style: { fill: chartAxisColor, fontSize: 11 } }}
                />
                <Tooltip
                  contentStyle={{
                    background: chartTooltipBg,
                    border: `1px solid ${chartTooltipBorder}`,
                    borderRadius: '8px',
                    color: chartTooltipText,
                    fontSize: '13px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Recent activity */}
        <GlassCard hover={false} className="p-6">
          <h3 className="text-[13px] font-semibold text-cc-text-primary mb-5 uppercase tracking-[0.04em]">Recent Activity</h3>
          <div className="space-y-0">
            {filteredActivities.length === 0 ? (
              <p className="text-xs text-cc-text-muted text-center py-8">No recent activity</p>
            ) : (
              filteredActivities.map(a => {
                const Icon = getActivityIcon(a.action)
                return (
                  <div key={a.id} className="flex gap-3 py-3 border-b border-cc-border last:border-0">
                    <Icon className="h-3.5 w-3.5 text-cc-text-muted mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-cc-text-secondary line-clamp-2">{formatLabel(a.description)}</p>
                      <p className="text-[10px] text-cc-text-muted mt-0.5">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
