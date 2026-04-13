'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MetricCard } from '@/components/ui/metric-card'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getDealsInRange, getContactsInRange, getActivitiesInRange } from '@/lib/reports'
import { PROPERTY_STAGES, BUYER_TYPES, type Deal, type Contact, type Activity, type BuyerType } from '@/lib/types'
import { useTheme } from '@/components/theme-provider'
import {
  DollarSign,
  TrendingUp,
  Users,
  Activity as ActivityIcon,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  UserPlus,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subDays } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'
import { formatLabel } from '@/lib/utils'

type ReportTab = 'pipeline' | 'revenue' | 'activity' | 'contacts' | 'buyer_types'
type DatePreset = 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'

function getDateRange(preset: DatePreset, customStart: string, customEnd: string): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString()

  switch (preset) {
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), end }
    case 'month':
      return { start: startOfMonth(now).toISOString(), end }
    case 'quarter':
      return { start: startOfQuarter(now).toISOString(), end }
    case 'year':
      return { start: startOfYear(now).toISOString(), end }
    case 'all':
      return { start: '2000-01-01T00:00:00.000Z', end }
    case 'custom':
      return {
        start: customStart ? new Date(customStart).toISOString() : '2000-01-01T00:00:00.000Z',
        end: customEnd ? new Date(customEnd + 'T23:59:59').toISOString() : end,
      }
  }
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

const BUYER_TYPE_CHART_COLORS: Record<BuyerType, { light: string; dark: string }> = {
  investor: { light: '#1E40AF', dark: '#93C5FD' },
  developer: { light: '#5B21B6', dark: '#C4B5FD' },
  owner_occupier: { light: '#065F46', dark: '#6EE7B7' },
}

const BUYER_TYPE_CARD_COLORS: Record<BuyerType, { lightBg: string; lightText: string; darkBg: string; darkText: string }> = {
  investor: { lightBg: '#DBEAFE', lightText: '#1E40AF', darkBg: '#1E3A5F', darkText: '#93C5FD' },
  developer: { lightBg: '#EDE9FE', lightText: '#5B21B6', darkBg: '#4C1D95', darkText: '#C4B5FD' },
  owner_occupier: { lightBg: '#D1FAE5', lightText: '#065F46', darkBg: '#064E3B', darkText: '#6EE7B7' },
}

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('pipeline')
  const [preset, setPreset] = useState<DatePreset>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const { theme } = useTheme()

  const { start, end } = useMemo(() => getDateRange(preset, customStart, customEnd), [preset, customStart, customEnd])

  useEffect(() => {
    getDealsInRange(start, end).then(setDeals)
    getContactsInRange(start, end).then(setContacts)
    getActivitiesInRange(start, end).then(setActivities)
  }, [start, end])

  const isDark = theme === 'dark'
  const chartColors = isDark
    ? ['#34D399', '#60A5FA', '#FBBF24', '#FB7185', '#A78BFA', '#22D3EE', '#F97316', '#059669', '#9CA3AF']
    : ['#10B981', '#3B82F6', '#F59E0B', '#FB7185', '#8B5CF6', '#06B6D4', '#F97316', '#059669', '#9CA3AF']
  const chartAxisColor = isDark ? '#555555' : '#8B95A0'
  const chartGridColor = isDark ? '#222222' : '#D8DEE4'
  const chartTooltipBg = isDark ? '#111111' : '#F7F7F7'
  const chartTooltipBorder = isDark ? '#222222' : '#D8DEE4'
  const chartTooltipText = isDark ? '#FFFFFF' : '#000000'

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'activity', label: 'Activity' },
    { key: 'contacts', label: 'Contacts' },
    { key: 'buyer_types', label: 'Buyer Types' },
  ]

  const presets: { key: DatePreset; label: string }[] = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
    { key: 'year', label: 'This Year' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ]

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

  // ── Pipeline Report ──
  const pipelineChartData = PROPERTY_STAGES.map(stage => ({
    name: stageAbbreviations[stage.key] || stage.label,
    count: deals.filter(d => d.stage === stage.key).length,
    value: deals.filter(d => d.stage === stage.key).reduce((s, d) => s + (d.deal_value || 0), 0),
  }))

  const activeDealsArr = deals.filter(d => d.stage !== 'settled' && d.stage !== 'marketing_only')
  const pipelineValue = activeDealsArr.reduce((s, d) => s + (d.deal_value || 0), 0)
  const activeDeals = activeDealsArr.length
  const avgDealSize = activeDealsArr.length > 0 ? pipelineValue / activeDealsArr.length : 0
  const winRate = deals.length > 0 ? Math.round((deals.filter(d => d.stage === 'settled').length / deals.length) * 100) : 0
  const topDeals = [...deals].sort((a, b) => (b.deal_value || 0) - (a.deal_value || 0)).slice(0, 10)

  // ── Revenue Report ──
  const feeDeals = deals.filter(d => d.stage === 'settled' && d.fee_amount)
  const totalFees = feeDeals.reduce((s, d) => s + (d.fee_amount || 0), 0)
  const avgFee = feeDeals.length > 0 ? totalFees / feeDeals.length : 0
  const largestFee = feeDeals.reduce((max, d) => Math.max(max, d.fee_amount || 0), 0)

  const revenueChartData = useMemo(() => {
    const sorted = [...feeDeals].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    let cumulative = 0
    return sorted.map(d => {
      cumulative += d.fee_amount || 0
      return {
        date: format(new Date(d.created_at), 'MMM d'),
        total: cumulative,
        fee: d.fee_amount || 0,
      }
    })
  }, [feeDeals])

  // ── Activity Report ──
  const activityByType = useMemo(() => {
    const counts: Record<string, number> = {}
    activities.forEach(a => {
      counts[a.action] = (counts[a.action] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name: formatLabel(name), count }))
      .sort((a, b) => b.count - a.count)
  }, [activities])

  const mostActiveType = activityByType[0]?.name || '—'
  const recentActivityCount = activities.filter(a => {
    const d = new Date(a.created_at)
    return d >= subDays(new Date(), 7)
  }).length

  // ── Contact Report ──
  const contactsByStage = PROPERTY_STAGES.map(stage => ({
    name: stageAbbreviations[stage.key] || stage.label,
    count: contacts.filter(c => c.stage === stage.key).length,
  }))

  const newContactsByMonth = useMemo(() => {
    const months: Record<string, number> = {}
    contacts.forEach(c => {
      const key = format(new Date(c.created_at), 'MMM yyyy')
      months[key] = (months[key] || 0) + 1
    })
    return Object.entries(months).map(([name, count]) => ({ name, count }))
  }, [contacts])

  const staleContacts = contacts.filter(c => {
    const updated = new Date(c.updated_at)
    return updated < subDays(new Date(), 30)
  })

  const clientContacts = contacts.filter(c => c.type === 'client').length

  // ── Buyer Types Report ──
  const buyerTypeData = useMemo(() => {
    const data: Record<BuyerType, { count: number; pipelineValue: number; avgDealSize: number; contactIds: Set<string> }> = {
      investor: { count: 0, pipelineValue: 0, avgDealSize: 0, contactIds: new Set() },
      developer: { count: 0, pipelineValue: 0, avgDealSize: 0, contactIds: new Set() },
      owner_occupier: { count: 0, pipelineValue: 0, avgDealSize: 0, contactIds: new Set() },
    }

    for (const c of contacts) {
      if (c.buyer_type && data[c.buyer_type]) {
        data[c.buyer_type].count++
        data[c.buyer_type].contactIds.add(c.id)
      }
    }

    for (const d of deals) {
      if (!d.contact_id) continue
      for (const bt of BUYER_TYPES) {
        if (data[bt.key].contactIds.has(d.contact_id) && d.stage !== 'settled' && d.stage !== 'marketing_only') {
          data[bt.key].pipelineValue += d.deal_value || 0
        }
      }
    }

    for (const bt of BUYER_TYPES) {
      const btDeals = deals.filter(d => d.contact_id && data[bt.key].contactIds.has(d.contact_id) && d.stage !== 'settled' && d.stage !== 'marketing_only')
      data[bt.key].avgDealSize = btDeals.length > 0 ? data[bt.key].pipelineValue / btDeals.length : 0
    }

    return data
  }, [contacts, deals])

  const contactDistributionData = useMemo(() =>
    BUYER_TYPES.map(bt => ({
      name: bt.label,
      count: buyerTypeData[bt.key].count,
      key: bt.key,
    })),
  [buyerTypeData])

  const pipelineDistributionData = useMemo(() =>
    BUYER_TYPES.map(bt => ({
      name: bt.label,
      value: buyerTypeData[bt.key].pipelineValue,
      key: bt.key,
    })),
  [buyerTypeData])

  const stageBreakdownData = useMemo(() => {
    const contactsByBuyerType: Record<BuyerType, Set<string>> = {
      investor: new Set(), developer: new Set(), owner_occupier: new Set(),
    }
    for (const c of contacts) {
      if (c.buyer_type && contactsByBuyerType[c.buyer_type]) {
        contactsByBuyerType[c.buyer_type].add(c.id)
      }
    }

    return PROPERTY_STAGES.map(stage => {
      const row: Record<string, string | number> = {
        name: stageAbbreviations[stage.key] || stage.label,
      }
      for (const bt of BUYER_TYPES) {
        row[bt.key] = deals.filter(d =>
          d.stage === stage.key && d.contact_id && contactsByBuyerType[bt.key].has(d.contact_id)
        ).length
      }
      return row
    })
  }, [contacts, deals])

  const buyerTypeInsights = useMemo(() => {
    const entries = BUYER_TYPES.map(bt => ({
      key: bt.key,
      label: bt.label,
      count: buyerTypeData[bt.key].count,
      pipelineValue: buyerTypeData[bt.key].pipelineValue,
    }))

    const strongest = [...entries].sort((a, b) => b.pipelineValue - a.pipelineValue)[0]
    const growth = [...entries].sort((a, b) => a.pipelineValue - b.pipelineValue)[0]

    // Advanced stages: contracts_exchanged, settled
    const advancedStages = new Set(['contracts_exchanged', 'settled'])
    const contactsByBt: Record<string, Set<string>> = {}
    for (const bt of BUYER_TYPES) {
      contactsByBt[bt.key] = new Set(contacts.filter(c => c.buyer_type === bt.key).map(c => c.id))
    }

    let conversionLeader = { key: '', label: '', pct: 0 }
    for (const bt of BUYER_TYPES) {
      const btDeals = deals.filter(d => d.contact_id && contactsByBt[bt.key].has(d.contact_id))
      const advanced = btDeals.filter(d => advancedStages.has(d.stage)).length
      const pct = btDeals.length > 0 ? Math.round((advanced / btDeals.length) * 100) : 0
      if (pct > conversionLeader.pct) {
        conversionLeader = { key: bt.key, label: bt.label, pct }
      }
    }

    return { strongest, growth, conversionLeader }
  }, [buyerTypeData, contacts, deals])

  const getBtChartColor = (btKey: string) => {
    const colors = BUYER_TYPE_CHART_COLORS[btKey as BuyerType]
    return colors ? (isDark ? colors.dark : colors.light) : chartColors[0]
  }

  return (
    <div>
      <PageHeader title="Reports" description="Analytics and reporting dashboard" />

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border ${
              tab === t.key
                ? 'bg-cc-accent text-white border-cc-accent'
                : 'bg-transparent text-cc-text-secondary border-cc-border hover:border-cc-border-hover hover:text-cc-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Date range picker */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {presets.map(p => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border ${
              preset === p.key
                ? 'bg-cc-accent text-white border-cc-accent'
                : 'bg-transparent text-cc-text-secondary border-cc-border hover:border-cc-border-hover hover:text-cc-text-primary'
            }`}
          >
            {p.label}
          </button>
        ))}
        {preset === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <Input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="h-8 w-36 text-xs"
            />
            <span className="text-cc-text-muted text-xs">to</span>
            <Input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="h-8 w-36 text-xs"
            />
          </div>
        )}
      </div>

      {/* ═══ Pipeline Report ═══ */}
      {tab === 'pipeline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard label="Pipeline Value" value={formatCurrency(pipelineValue)} icon={DollarSign} />
            <MetricCard label="Active Deals" value={activeDeals} icon={TrendingUp} />
            <MetricCard label="Avg Deal Size" value={formatCurrency(avgDealSize)} icon={BarChart3} />
            <MetricCard label="Win Rate" value={`${winRate}%`} icon={Zap} />
          </div>

          <GlassCard hover={false} className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-medium text-cc-text-primary">Deals by Stage</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCSV('pipeline-report.csv', ['Stage', 'Count', 'Value'], pipelineChartData.map(d => [d.name, String(d.count), String(d.value)]))
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
              </Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineChartData}>
                  <XAxis dataKey="name" tick={{ fill: chartAxisColor, fontSize: 10 }} axisLine={{ stroke: chartGridColor }} tickLine={false} angle={-35} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} label={{ value: 'Deal Count', angle: -90, position: 'insideLeft', style: { fill: chartAxisColor, fontSize: 11 } }} />
                  <Tooltip
                    contentStyle={{ background: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '6px', color: chartTooltipText, fontSize: '13px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {pipelineChartData.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard hover={false} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-cc-text-primary">Top Deals</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCSV('top-deals.csv', ['Title', 'Stage', 'Value', 'Fee Amount', 'Contact'], topDeals.map(d => [d.title, d.stage, String(d.deal_value || 0), String(d.fee_amount || 0), d.contact?.name || '—']))
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-cc-border">
                  <TableHead className="text-cc-text-muted text-xs">Title</TableHead>
                  <TableHead className="text-cc-text-muted text-xs">Stage</TableHead>
                  <TableHead className="text-cc-text-muted text-xs text-right">Value</TableHead>
                  <TableHead className="text-cc-text-muted text-xs text-right">Fee</TableHead>
                  <TableHead className="text-cc-text-muted text-xs">Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDeals.map(d => (
                  <TableRow key={d.id} className="border-cc-border">
                    <TableCell className="text-cc-text-primary text-sm">{d.title}</TableCell>
                    <TableCell className="text-cc-text-secondary text-xs">{PROPERTY_STAGES.find(s => s.key === d.stage)?.label ?? d.stage}</TableCell>
                    <TableCell className="text-cc-text-primary text-sm text-right font-medium">{formatCurrency(d.deal_value || 0)}</TableCell>
                    <TableCell className="text-cc-text-secondary text-sm text-right">{formatCurrency(d.fee_amount || 0)}</TableCell>
                    <TableCell className="text-cc-text-secondary text-xs">{d.contact?.name || '—'}</TableCell>
                  </TableRow>
                ))}
                {topDeals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-cc-text-muted text-xs py-8">No deals in selected range</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </GlassCard>
        </div>
      )}

      {/* ═══ Revenue Report ═══ */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard label="Total Fees Earned" value={formatCurrency(totalFees)} icon={DollarSign} />
            <MetricCard label="Avg Fee / Deal" value={formatCurrency(avgFee)} icon={BarChart3} />
            <MetricCard label="Largest Fee" value={formatCurrency(largestFee)} icon={TrendingUp} />
            <MetricCard label="Completed Deals" value={feeDeals.length} icon={Zap} />
          </div>

          <GlassCard hover={false} className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-medium text-cc-text-primary">Cumulative Fees Over Time</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCSV('revenue-report.csv', ['Date', 'Fee', 'Cumulative Total'], revenueChartData.map(d => [d.date, String(d.fee), String(d.total)]))
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
              </Button>
            </div>
            <div className="h-72">
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDark ? '#5A7A94' : '#3B5068'} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={isDark ? '#5A7A94' : '#3B5068'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                    <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} label={{ value: 'Revenue', angle: -90, position: 'insideLeft', style: { fill: chartAxisColor, fontSize: 11 } }} />
                    <Tooltip
                      contentStyle={{ background: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '6px', color: chartTooltipText, fontSize: '13px' }}
                    />
                    <Area type="monotone" dataKey="total" stroke={isDark ? '#5A7A94' : '#3B5068'} fill="url(#areaGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-cc-text-muted text-sm">No revenue data in selected range</div>
              )}
            </div>
          </GlassCard>

          <GlassCard hover={false} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-cc-text-primary">Completed Deals</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCSV('completed-deals.csv', ['Title', 'Fee Amount', 'Deal Value', 'Fee %', 'Contact'], feeDeals.map(d => [d.title, String(d.fee_amount || 0), String(d.deal_value || 0), String(d.fee_percentage || 0), d.contact?.name || '—']))
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-cc-border">
                  <TableHead className="text-cc-text-muted text-xs">Title</TableHead>
                  <TableHead className="text-cc-text-muted text-xs text-right">Fee Amount</TableHead>
                  <TableHead className="text-cc-text-muted text-xs text-right">Deal Value</TableHead>
                  <TableHead className="text-cc-text-muted text-xs text-right">Fee %</TableHead>
                  <TableHead className="text-cc-text-muted text-xs">Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeDeals.map(d => (
                  <TableRow key={d.id} className="border-cc-border">
                    <TableCell className="text-cc-text-primary text-sm">{d.title}</TableCell>
                    <TableCell className="text-cc-text-primary text-sm text-right font-medium">{formatCurrency(d.fee_amount || 0)}</TableCell>
                    <TableCell className="text-cc-text-secondary text-sm text-right">{formatCurrency(d.deal_value || 0)}</TableCell>
                    <TableCell className="text-cc-text-secondary text-sm text-right">{d.fee_percentage ? `${d.fee_percentage}%` : '—'}</TableCell>
                    <TableCell className="text-cc-text-secondary text-xs">{d.contact?.name || '—'}</TableCell>
                  </TableRow>
                ))}
                {feeDeals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-cc-text-muted text-xs py-8">No completed deals in selected range</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </GlassCard>
        </div>
      )}

      {/* ═══ Activity Report ═══ */}
      {tab === 'activity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <MetricCard label="Total Activities" value={activities.length} icon={ActivityIcon} />
            <MetricCard label="Most Active Type" value={mostActiveType} icon={Zap} />
            <MetricCard label="Last 7 Days" value={recentActivityCount} icon={BarChart3} />
          </div>

          <GlassCard hover={false} className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-medium text-cc-text-primary">Activities by Type</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCSV('activity-report.csv', ['Type', 'Count'], activityByType.map(d => [d.name, String(d.count)]))
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
              </Button>
            </div>
            <div className="h-64">
              {activityByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityByType}>
                    <XAxis dataKey="name" tick={{ fill: chartAxisColor, fontSize: 10 }} axisLine={{ stroke: chartGridColor }} tickLine={false} angle={-35} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fill: chartAxisColor, fontSize: 11 } }} />
                    <Tooltip
                      contentStyle={{ background: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '6px', color: chartTooltipText, fontSize: '13px' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {activityByType.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-cc-text-muted text-sm">No activities in selected range</div>
              )}
            </div>
          </GlassCard>

          <GlassCard hover={false} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-cc-text-primary">Recent Activities</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCSV('recent-activities.csv', ['Action', 'Description', 'Entity Type', 'Date'], activities.slice(0, 20).map(a => [formatLabel(a.action), a.description, a.entity_type, format(new Date(a.created_at), 'yyyy-MM-dd HH:mm')]))
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-cc-border">
                  <TableHead className="text-cc-text-muted text-xs">Action</TableHead>
                  <TableHead className="text-cc-text-muted text-xs">Description</TableHead>
                  <TableHead className="text-cc-text-muted text-xs">Type</TableHead>
                  <TableHead className="text-cc-text-muted text-xs">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.slice(0, 20).map(a => (
                  <TableRow key={a.id} className="border-cc-border">
                    <TableCell className="text-cc-text-primary text-sm">{formatLabel(a.action)}</TableCell>
                    <TableCell className="text-cc-text-secondary text-xs max-w-xs truncate">{a.description}</TableCell>
                    <TableCell className="text-cc-text-secondary text-xs capitalize">{a.entity_type}</TableCell>
                    <TableCell className="text-cc-text-muted text-xs">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</TableCell>
                  </TableRow>
                ))}
                {activities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-cc-text-muted text-xs py-8">No activities in selected range</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </GlassCard>
        </div>
      )}

      {/* ═══ Contact Report ═══ */}
      {tab === 'contacts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard label="Total Contacts" value={contacts.length} icon={Users} />
            <MetricCard label="Clients" value={clientContacts} icon={UserPlus} />
            <MetricCard label="Stale (30+ days)" value={staleContacts.length} icon={PieChartIcon} />
            <MetricCard label="New This Month" value={contacts.filter(c => new Date(c.created_at) >= startOfMonth(new Date())).length} icon={TrendingUp} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard hover={false} className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-medium text-cc-text-primary">New Contacts Over Time</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadCSV('contacts-over-time.csv', ['Month', 'Count'], newContactsByMonth.map(d => [d.name, String(d.count)]))
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
                </Button>
              </div>
              <div className="h-64">
                {newContactsByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={newContactsByMonth}>
                      <XAxis dataKey="name" tick={{ fill: chartAxisColor, fontSize: 10 }} axisLine={{ stroke: chartGridColor }} tickLine={false} angle={-35} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} label={{ value: 'Contacts', angle: -90, position: 'insideLeft', style: { fill: chartAxisColor, fontSize: 11 } }} />
                      <Tooltip
                        contentStyle={{ background: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '6px', color: chartTooltipText, fontSize: '13px' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {newContactsByMonth.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-cc-text-muted text-sm">No contacts in selected range</div>
                )}
              </div>
            </GlassCard>

            <GlassCard hover={false} className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-medium text-cc-text-primary">Contacts by Stage</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadCSV('contacts-by-stage.csv', ['Stage', 'Count'], contactsByStage.map(d => [d.name, String(d.count)]))
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
                </Button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contactsByStage} layout="vertical">
                    <XAxis type="number" tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} label={{ value: 'Count', position: 'insideBottom', offset: -5, style: { fill: chartAxisColor, fontSize: 11 } }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: chartAxisColor, fontSize: 10 }} axisLine={{ stroke: chartGridColor }} tickLine={false} width={100} />
                    <Tooltip
                      contentStyle={{ background: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '6px', color: chartTooltipText, fontSize: '13px' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {contactsByStage.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <GlassCard hover={false} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-cc-text-primary">Stale Contacts (30+ days inactive)</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCSV('stale-contacts.csv', ['Name', 'Email', 'Company', 'Stage', 'Last Updated'], staleContacts.map(c => [c.name, c.email || '', c.company || '', c.stage, format(new Date(c.updated_at), 'yyyy-MM-dd')]))
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-cc-border">
                  <TableHead className="text-cc-text-muted text-xs">Name</TableHead>
                  <TableHead className="text-cc-text-muted text-xs">Email</TableHead>
                  <TableHead className="text-cc-text-muted text-xs">Company</TableHead>
                  <TableHead className="text-cc-text-muted text-xs">Stage</TableHead>
                  <TableHead className="text-cc-text-muted text-xs">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staleContacts.map(c => (
                  <TableRow key={c.id} className="border-cc-border">
                    <TableCell className="text-cc-text-primary text-sm">{c.name}</TableCell>
                    <TableCell className="text-cc-text-secondary text-xs">{c.email || '—'}</TableCell>
                    <TableCell className="text-cc-text-secondary text-xs">{c.company || '—'}</TableCell>
                    <TableCell className="text-cc-text-secondary text-xs">{PROPERTY_STAGES.find(s => s.key === c.stage)?.label ?? c.stage}</TableCell>
                    <TableCell className="text-cc-text-muted text-xs">{formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</TableCell>
                  </TableRow>
                ))}
                {staleContacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-cc-text-muted text-xs py-8">No stale contacts</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </GlassCard>
        </div>
      )}

      {/* ═══ Buyer Types Report ═══ */}
      {tab === 'buyer_types' && (
        <div className="space-y-6">
          {/* Row 1: Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {BUYER_TYPES.map(bt => {
              const data = buyerTypeData[bt.key]
              const cardColors = BUYER_TYPE_CARD_COLORS[bt.key]
              const bgColor = isDark ? cardColors.darkBg : cardColors.lightBg
              const textColor = isDark ? cardColors.darkText : cardColors.lightText
              return (
                <GlassCard key={bt.key} hover={false} className="p-5" style={{ borderTop: `3px solid ${textColor}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: textColor }} />
                    <h4 className="text-sm font-semibold text-cc-text-primary">{bt.label}s</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-cc-text-muted">Contacts</p>
                      <p className="text-xl font-bold text-cc-text-primary">{data.count}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-cc-text-muted">Pipeline</p>
                      <p className="text-xl font-bold text-cc-text-primary">{formatCurrency(data.pipelineValue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-cc-text-muted">Avg Deal</p>
                      <p className="text-xl font-bold text-cc-text-primary">{formatCurrency(data.avgDealSize)}</p>
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </div>

          {/* Row 2: Distribution charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard hover={false} className="p-6">
              <h3 className="text-sm font-medium text-cc-text-primary mb-5">Contacts by Buyer Type</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contactDistributionData} layout="vertical">
                    <XAxis type="number" tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} width={110} />
                    <Tooltip
                      contentStyle={{ background: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '6px', color: chartTooltipText, fontSize: '13px' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: chartAxisColor, fontSize: 11 }}>
                      {contactDistributionData.map((d) => (
                        <Cell key={d.key} fill={getBtChartColor(d.key)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard hover={false} className="p-6">
              <h3 className="text-sm font-medium text-cc-text-primary mb-5">Pipeline Value by Buyer Type</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineDistributionData} layout="vertical">
                    <XAxis type="number" tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis dataKey="name" type="category" tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} width={110} />
                    <Tooltip
                      contentStyle={{ background: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '6px', color: chartTooltipText, fontSize: '13px' }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Pipeline Value']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: chartAxisColor, fontSize: 11, formatter: (v) => formatCurrency(Number(v)) }}>
                      {pipelineDistributionData.map((d) => (
                        <Cell key={d.key} fill={getBtChartColor(d.key)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Row 3: Stage breakdown */}
          <GlassCard hover={false} className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-medium text-cc-text-primary">Stage Distribution by Buyer Type</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const headers = ['Stage', ...BUYER_TYPES.map(bt => bt.label)]
                  const rows = stageBreakdownData.map(d => [
                    String(d.name),
                    ...BUYER_TYPES.map(bt => String(d[bt.key] ?? 0)),
                  ])
                  downloadCSV('buyer-type-stage-breakdown.csv', headers, rows)
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
              </Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageBreakdownData}>
                  <XAxis dataKey="name" tick={{ fill: chartAxisColor, fontSize: 10 }} axisLine={{ stroke: chartGridColor }} tickLine={false} angle={-35} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} label={{ value: 'Deal Count', angle: -90, position: 'insideLeft', style: { fill: chartAxisColor, fontSize: 11 } }} />
                  <Tooltip
                    contentStyle={{ background: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '6px', color: chartTooltipText, fontSize: '13px' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', color: chartAxisColor }}
                    formatter={(value: string) => {
                      const bt = BUYER_TYPES.find(b => b.key === value)
                      return bt ? bt.label : value
                    }}
                  />
                  {BUYER_TYPES.map(bt => (
                    <Bar key={bt.key} dataKey={bt.key} fill={getBtChartColor(bt.key)} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Row 4: Insights */}
          <GlassCard hover={false} className="p-6">
            <h3 className="text-sm font-medium text-cc-text-primary mb-4">Insights</h3>
            <div className="space-y-3">
              {buyerTypeInsights.strongest && (
                <p className="text-sm text-cc-text-secondary">
                  Strongest segment: <span className="font-semibold text-cc-text-primary">{buyerTypeInsights.strongest.label}s</span> ({buyerTypeInsights.strongest.count} contacts, {formatCurrency(buyerTypeInsights.strongest.pipelineValue)} pipeline)
                </p>
              )}
              {buyerTypeInsights.growth && (
                <p className="text-sm text-cc-text-secondary">
                  Growth opportunity: <span className="font-semibold text-cc-text-primary">{buyerTypeInsights.growth.label}s</span> ({buyerTypeInsights.growth.count} contacts, {formatCurrency(buyerTypeInsights.growth.pipelineValue)} pipeline)
                </p>
              )}
              {buyerTypeInsights.conversionLeader.key && (
                <p className="text-sm text-cc-text-secondary">
                  Conversion leader: <span className="font-semibold text-cc-text-primary">{buyerTypeInsights.conversionLeader.label}s</span> — {buyerTypeInsights.conversionLeader.pct}% in advanced stages
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
