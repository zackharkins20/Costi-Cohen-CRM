'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MetricCard } from '@/components/ui/metric-card'
import { GlassCard } from '@/components/ui/glass-card'
import { getContacts, getDeals, getRecentActivities } from '@/lib/queries'
import { PROPERTY_STAGES, type Contact, type Deal, type Activity } from '@/lib/types'
import { DollarSign, TrendingUp, Users, CheckCircle, MessageSquare } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatDistanceToNow } from 'date-fns'

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    getContacts().then(setContacts)
    getDeals().then(setDeals)
    getRecentActivities(10).then(setActivities)
  }, [])

  const pipelineValue = deals.reduce((sum, d) => sum + (d.deal_value || 0), 0)
  const activeDeals = deals.filter(d => d.stage !== 'fees_collected').length
  const feesEarned = deals
    .filter(d => d.stage === 'fees_collected')
    .reduce((sum, d) => sum + (d.fee_amount || 0), 0)

  const chartData = PROPERTY_STAGES.map(stage => ({
    name: stage.label.length > 15 ? stage.label.slice(0, 15) + '…' : stage.label,
    count: contacts.filter(c => c.stage === stage.key).length,
  }))

  const formatCurrency = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your pipeline and activity" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Pipeline Value" value={formatCurrency(pipelineValue)} icon={DollarSign} />
        <MetricCard label="Active Deals" value={activeDeals} icon={TrendingUp} />
        <MetricCard label="Contacts" value={contacts.length} icon={Users} />
        <MetricCard label="Fees Earned" value={formatCurrency(feesEarned)} icon={CheckCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline chart */}
        <GlassCard hover={false} className="lg:col-span-2 p-5">
          <h3 className="text-sm font-medium text-[var(--cc-text-primary)] mb-4">Pipeline by Stage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--cc-text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--cc-divider)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--cc-text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--cc-surface)',
                    border: '1px solid var(--cc-glass-border)',
                    borderRadius: '8px',
                    color: 'var(--cc-text-primary)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${150 + i * 20}, 50%, ${45 + i * 5}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Recent activity */}
        <GlassCard hover={false} className="p-5">
          <h3 className="text-sm font-medium text-[var(--cc-text-primary)] mb-4">Recent Activity</h3>
          <div className="space-y-0">
            {activities.length === 0 ? (
              <p className="text-xs text-[var(--cc-text-muted)] text-center py-8">No recent activity</p>
            ) : (
              activities.map(a => (
                <div key={a.id} className="flex gap-3 py-2.5 border-b border-[var(--cc-divider)] last:border-0">
                  <MessageSquare className="h-3.5 w-3.5 text-[var(--cc-text-muted)] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--cc-text-secondary)] line-clamp-2">{a.description}</p>
                    <p className="text-[10px] text-[var(--cc-text-muted)] mt-0.5">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
