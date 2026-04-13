'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { ComposeEmailSheet } from '@/components/email/compose-email-sheet'
import { getEmails, deleteEmail } from '@/lib/emails'
import { getCurrentUser } from '@/lib/queries'
import type { Email } from '@/lib/types'
import { Mail, Plus, Search, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type StatusFilter = 'all' | 'sent' | 'draft' | 'failed'
type EntityFilter = 'all' | 'deal' | 'contact'

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all')
  const [composeOpen, setComposeOpen] = useState(false)
  const [userId, setUserId] = useState<string>()

  const loadEmails = () => {
    getEmails().then(setEmails)
  }

  useEffect(() => {
    loadEmails()
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
  }, [])

  const filtered = emails.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    if (entityFilter !== 'all' && e.entity_type !== entityFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        e.subject.toLowerCase().includes(q) ||
        e.to_address.toLowerCase().includes(q) ||
        (e.body || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleDelete = async (id: string) => {
    await deleteEmail(id)
    loadEmails()
  }

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'sent', label: 'Sent' },
    { key: 'draft', label: 'Drafts' },
    { key: 'failed', label: 'Failed' },
  ]

  const entityFilters: { key: EntityFilter; label: string }[] = [
    { key: 'all', label: 'All Types' },
    { key: 'deal', label: 'Deals' },
    { key: 'contact', label: 'Contacts' },
  ]

  const getStatusStyle = (status: Email['status']) => {
    switch (status) {
      case 'sent':
        return 'border-cc-text-primary text-cc-text-primary border-2'
      case 'draft':
        return 'border-cc-text-secondary text-cc-text-secondary'
      case 'failed':
        return 'border-cc-text-muted text-cc-text-muted border-dashed'
    }
  }

  return (
    <div>
      <PageHeader title="Emails" description="Compose and track email communications">
        <Button variant="outline" onClick={() => setComposeOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Compose
        </Button>
      </PageHeader>

      {/* Search and filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cc-text-muted" />
          <Input
            placeholder="Search emails..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1">
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border ${
                statusFilter === f.key
                  ? 'bg-transparent text-cc-text-primary border-cc-btn-border'
                  : 'bg-transparent text-cc-text-secondary border-cc-border hover:border-cc-border-hover hover:text-cc-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-cc-border" />

        <div className="flex items-center gap-1">
          {entityFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setEntityFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border ${
                entityFilter === f.key
                  ? 'bg-transparent text-cc-text-primary border-cc-btn-border'
                  : 'bg-transparent text-cc-text-secondary border-cc-border hover:border-cc-border-hover hover:text-cc-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Email list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No emails"
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Compose your first email to get started'}
          action={
            <Button variant="outline" onClick={() => setComposeOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Compose Email
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(email => (
            <GlassCard key={email.id} hover={false} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-cc-text-primary truncate">{email.subject || '(no subject)'}</h3>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium border rounded-md ${getStatusStyle(email.status)}`}>
                      {email.status}
                    </span>
                  </div>
                  <p className="text-xs text-cc-text-secondary mb-1">To: {email.to_address}</p>
                  {email.body && (
                    <p className="text-xs text-cc-text-muted line-clamp-1">{email.body}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-cc-text-muted">
                      {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                    </span>
                    {email.entity_type && (
                      <span className="text-[10px] text-cc-text-muted capitalize">
                        Linked to {email.entity_type}
                      </span>
                    )}
                    {email.template_id && (
                      <span className="text-[10px] text-cc-text-muted">
                        Template: {email.template_id}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(email.id)}
                  className="p-1.5 text-cc-text-muted hover:text-cc-text-primary transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Compose sheet */}
      <ComposeEmailSheet
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        userId={userId}
        onSent={loadEmails}
      />
    </div>
  )
}
