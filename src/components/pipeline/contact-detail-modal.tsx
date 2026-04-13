'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ActivityTimeline } from '@/components/activity/activity-timeline'
import { DraftEmailSheet } from '@/components/email/draft-email-sheet'
import { updateContact, deleteContact, logActivity, getDeals } from '@/lib/queries'
import { DocumentManager } from '@/components/documents/document-manager'
import { UpcomingEvents } from '@/components/events/upcoming-events'
import { EmailHistory } from '@/components/email/email-history'
import { PROPERTY_STAGES, type PropertyStage, type Contact, type Deal } from '@/lib/types'
import { Mail, Pencil, Phone, Building2, AtSign, Trash2, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Props {
  contact: Contact | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
  userId?: string
}

const sectionLabel = "text-[12px] font-medium uppercase tracking-[0.05em] text-cc-text-muted mb-3"

export function ContactDetailModal({ contact, open, onClose, onUpdated, userId }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Contact>>({})
  const [emailOpen, setEmailOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [linkedDeals, setLinkedDeals] = useState<Deal[]>([])
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [inlineNotes, setInlineNotes] = useState<{ text: string; created_at: string }[]>([])

  useEffect(() => {
    if (contact) {
      setForm(contact)
      setInlineNotes([])
      setNewNote('')
      getDeals().then(deals => {
        setLinkedDeals(deals.filter(d => d.contact_id === contact.id))
      })
    }
  }, [contact])

  const handleAddNote = async () => {
    if (!newNote.trim() || !contact) return
    setAddingNote(true)
    await logActivity({
      entity_type: 'contact',
      entity_id: contact.id,
      action: 'note',
      description: newNote.trim(),
      created_by: userId,
    })
    setInlineNotes(prev => [{ text: newNote.trim(), created_at: new Date().toISOString() }, ...prev])
    setNewNote('')
    setAddingNote(false)
  }

  if (!contact) return null

  const handleSave = async () => {
    await updateContact(contact.id, form)
    if (form.stage !== contact.stage) {
      await logActivity({
        entity_type: 'contact',
        entity_id: contact.id,
        action: 'stage_change',
        description: `Stage changed from ${contact.stage} to ${form.stage}`,
        created_by: userId,
      })
    }
    setEditing(false)
    onUpdated()
  }

  const handleDelete = async () => {
    await deleteContact(contact.id)
    setConfirmDelete(false)
    onClose()
    onUpdated()
  }

  const formatBudget = (n: number | null) => {
    if (!n) return '—'
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    return `$${n.toLocaleString()}`
  }

  const stageInfo = PROPERTY_STAGES.find(s => s.key === contact.stage)

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-[450px] p-0">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <SheetTitle className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cc-surface-2 border border-cc-border flex items-center justify-center text-cc-text-primary font-semibold text-sm flex-shrink-0">
                  {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="block text-lg font-bold text-cc-text-primary">{contact.name}</span>
                  {contact.company && (
                    <span className="block text-xs font-normal text-cc-text-secondary">{contact.company}</span>
                  )}
                </div>
              </SheetTitle>
              <div className="flex gap-1.5 flex-shrink-0 mt-1">
                <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)} className="h-8 px-3 text-xs rounded-lg">
                  <Mail className="h-3.5 w-3.5 mr-1.5" /> Compose
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8 px-3 text-xs rounded-lg">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="px-6 pb-6 space-y-6">
            {/* Edit mode bar */}
            {editing && (
              <div className="flex items-center gap-2 p-3 bg-cc-surface-2 rounded-xl border border-cc-border">
                <span className="text-xs text-cc-text-secondary flex-1">Editing contact</span>
                <Button size="sm" onClick={handleSave} className="h-7 text-xs rounded-lg">Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(contact) }} className="h-7 text-xs rounded-lg">Cancel</Button>
              </div>
            )}

            {/* CONTACT INFO */}
            <div>
              <h4 className={sectionLabel}>Contact Info</h4>
              <div className="rounded-xl border border-cc-border bg-cc-surface p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <AtSign className="h-4 w-4 text-cc-text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="h-8 text-sm" placeholder="Email" />
                    ) : (
                      <span className="text-sm text-cc-text-secondary truncate block">{contact.email || '—'}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-cc-text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-8 text-sm" placeholder="Phone" />
                    ) : (
                      <span className="text-sm text-cc-text-secondary truncate block">{contact.phone || '—'}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-cc-text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <Input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} className="h-8 text-sm" placeholder="Company" />
                    ) : (
                      <span className="text-sm text-cc-text-secondary truncate block">{contact.company || '—'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE */}
            <div>
              <h4 className={sectionLabel}>Stage</h4>
              {editing ? (
                <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v as PropertyStage })}>
                  <SelectTrigger className="rounded-full h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-cc-surface border border-cc-border">
                  <span className="w-2 h-2 rounded-full bg-cc-accent flex-shrink-0" />
                  <span className="text-sm text-cc-text-primary">{stageInfo?.label || contact.stage}</span>
                </div>
              )}
            </div>

            {/* BRIEF */}
            <div>
              <h4 className={sectionLabel}>Brief</h4>
              <div className="rounded-xl p-4 bg-[#EDF0F4] [data-theme='dark']_&:bg-[#2A3344] border border-cc-border"
                   style={{ background: 'var(--cc-surface-2)' }}>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">Asset Type</span>
                    {editing ? (
                      <Input value={form.asset_type || ''} onChange={e => setForm({ ...form, asset_type: e.target.value })} className="h-7 text-xs" />
                    ) : (
                      <span className="text-sm text-cc-text-primary">{contact.asset_type || '—'}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">Fee %</span>
                    {editing ? (
                      <Input type="number" step="0.1" value={form.fee_percentage || ''} onChange={e => setForm({ ...form, fee_percentage: Number(e.target.value) })} className="h-7 text-xs" />
                    ) : (
                      <span className="text-sm text-cc-text-primary">{contact.fee_percentage ? `${contact.fee_percentage}%` : '—'}</span>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">Budget Range</span>
                  <span className="text-sm text-cc-text-primary font-medium">
                    {formatBudget(contact.budget_min)} – {formatBudget(contact.budget_max)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">Comments</span>
                  {editing ? (
                    <Textarea value={form.brief_notes || ''} onChange={e => setForm({ ...form, brief_notes: e.target.value })} placeholder="Brief notes..." className="text-xs min-h-[40px]" />
                  ) : (
                    <span className="text-sm text-cc-text-secondary">{contact.brief_notes || '—'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* NOTES */}
            <div>
              <h4 className={sectionLabel}>Notes</h4>
              <div className="rounded-xl border border-cc-border bg-cc-surface p-4 space-y-3">
                {/* Inline add note */}
                {!editing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote() } }}
                      placeholder="Add a note..."
                      className="flex-1 bg-cc-surface-2 border border-cc-border rounded-lg px-3 py-2 text-sm text-cc-text-primary placeholder:text-cc-text-muted focus:outline-none focus:border-cc-accent"
                    />
                    <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim() || addingNote} className="h-9 px-3">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                {/* Inline notes just added */}
                {inlineNotes.map((note, i) => (
                  <div key={`inline-${i}`} className="rounded-lg bg-cc-surface-2 border border-cc-border px-3 py-2">
                    <p className="text-sm text-cc-text-secondary">{note.text}</p>
                    <p className="text-[10px] text-cc-text-muted mt-1">Just now</p>
                  </div>
                ))}
                {/* Existing notes */}
                {editing ? (
                  <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="min-h-[60px] text-sm" />
                ) : (
                  contact.notes ? (
                    <p className="text-sm text-cc-text-secondary">{contact.notes}</p>
                  ) : inlineNotes.length === 0 ? (
                    <p className="text-sm text-cc-text-muted">No notes yet</p>
                  ) : null
                )}
              </div>
            </div>

            {/* DOCUMENTS */}
            <div>
              <h4 className={sectionLabel}>Documents</h4>
              <div className="rounded-xl border border-cc-border bg-cc-surface p-4">
                <DocumentManager entityType="contact" entityId={contact.id} userId={userId} />
              </div>
            </div>

            {/* EMAILS */}
            <div>
              <h4 className={sectionLabel}>
                <span className="flex items-center justify-between">
                  Emails
                  <button onClick={() => setEmailOpen(true)} className="text-[11px] text-cc-accent hover:text-cc-text-primary font-normal normal-case tracking-normal">
                    + Compose
                  </button>
                </span>
              </h4>
              <div className="rounded-xl border border-cc-border bg-cc-surface p-4">
                <EmailHistory entityType="contact" entityId={contact.id} />
              </div>
            </div>

            {/* UPCOMING EVENTS */}
            <div>
              <h4 className={sectionLabel}>Upcoming Events</h4>
              <div className="rounded-xl border border-cc-border bg-cc-surface p-4">
                <UpcomingEvents entityType="contact" entityId={contact.id} />
              </div>
            </div>

            {/* ACTIVITY */}
            <div>
              <h4 className={sectionLabel}>Activity</h4>
              <div className="rounded-xl border border-cc-border bg-cc-surface p-4">
                <ActivityTimeline entityType="contact" entityId={contact.id} userId={userId} />
              </div>
            </div>

            {/* DELETE */}
            <div className="pt-2">
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-cc-destructive hover:text-cc-text-primary transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete contact
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <DraftEmailSheet open={emailOpen} onClose={() => setEmailOpen(false)} contact={contact} userId={userId} />

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {contact.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
