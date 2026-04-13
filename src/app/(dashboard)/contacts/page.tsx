'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
import { StageBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateContactForm } from '@/components/forms/create-contact-form'
import { ContactDetailModal } from '@/components/pipeline/contact-detail-modal'
import { getContacts, getCurrentUser } from '@/lib/queries'
import { getDocumentCounts } from '@/lib/documents'
import type { Contact } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Users, Mail, Phone, Paperclip } from 'lucide-react'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [userId, setUserId] = useState<string>()
  const [docCounts, setDocCounts] = useState<Record<string, number>>({})

  const load = () => {
    getContacts().then(c => {
      setContacts(c)
      getDocumentCounts('contact', c.map(ct => ct.id)).then(setDocCounts)
    })
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
  }

  useEffect(() => { load() }, [])

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Contacts" description={`${contacts.length} contacts`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cc-text-muted" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-56 h-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Contact
        </Button>
      </PageHeader>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add your first contact to start building your pipeline."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Contact
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(contact => {
            const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <GlassCard
                key={contact.id}
                className="p-5"
                onClick={() => { setSelectedContact(contact); setDetailOpen(true) }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cc-surface-2 border border-cc-border flex items-center justify-center text-cc-text-primary font-semibold text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-cc-text-primary truncate">{contact.name}</p>
                    {contact.company && (
                      <p className="text-xs text-cc-text-secondary truncate">{contact.company}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-cc-text-muted">
                      {contact.email && (
                        <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" /> {contact.email}</span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone}</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <StageBadge stage={contact.stage} />
                      {docCounts[contact.id] > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-cc-text-muted">
                          <Paperclip className="h-3 w-3" /> {docCounts[contact.id]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      <CreateContactForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => load()}
        userId={userId}
      />

      <ContactDetailModal
        contact={selectedContact}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={load}
        userId={userId}
      />
    </div>
  )
}
