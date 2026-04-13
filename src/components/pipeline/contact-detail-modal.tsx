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
import { Separator } from '@/components/ui/separator'
import { StageBadge } from '@/components/ui/status-badge'
import { ActivityTimeline } from '@/components/activity/activity-timeline'
import { DraftEmailSheet } from '@/components/email/draft-email-sheet'
import { updateContact, deleteContact, logActivity, getDocumentLinks, createDocumentLink, deleteDocumentLink } from '@/lib/queries'
import { PROPERTY_STAGES, type PropertyStage, type Contact, type DocumentLink } from '@/lib/types'
import { Mail, Trash2, Link as LinkIcon, Plus, ExternalLink } from 'lucide-react'
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

export function ContactDetailModal({ contact, open, onClose, onUpdated, userId }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Contact>>({})
  const [emailOpen, setEmailOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [docLinks, setDocLinks] = useState<DocumentLink[]>([])
  const [newDocUrl, setNewDocUrl] = useState('')
  const [newDocTitle, setNewDocTitle] = useState('')

  useEffect(() => {
    if (contact) {
      setForm(contact)
      getDocumentLinks('contact', contact.id).then(setDocLinks)
    }
  }, [contact])

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

  const handleAddDocLink = async () => {
    if (!newDocUrl.trim() || !newDocTitle.trim()) return
    await createDocumentLink({
      entity_type: 'contact',
      entity_id: contact.id,
      url: newDocUrl,
      title: newDocTitle,
      created_by: userId || '',
    })
    setNewDocUrl('')
    setNewDocTitle('')
    getDocumentLinks('contact', contact.id).then(setDocLinks)
  }

  const inputClass = 'bg-[var(--cc-glass-bg)] border-[var(--cc-glass-border)] text-[var(--cc-text-primary)]'

  const formatBudget = (n: number | null) => {
    if (!n) return '—'
    return `$${(n / 1_000_000).toFixed(1)}M`
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="bg-[var(--cc-surface)] border-[var(--cc-glass-border)] overflow-y-auto w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="text-[var(--cc-text-primary)] flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-[var(--cc-accent-soft)] flex items-center justify-center text-[var(--cc-accent)] font-semibold text-sm flex-shrink-0">
                {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="block">{contact.name}</span>
                {contact.company && (
                  <span className="block text-xs font-normal text-[var(--cc-text-tertiary)]">{contact.company}</span>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4 px-1">
            {/* Stage */}
            <div className="flex items-center gap-2">
              <StageBadge stage={contact.stage} />
              {editing && (
                <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v as PropertyStage })}>
                  <SelectTrigger className={`w-48 ${inputClass}`}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[var(--cc-surface)] border-[var(--cc-glass-border)]">
                    {PROPERTY_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button size="sm" onClick={handleSave} className="bg-[var(--cc-accent)] text-white">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(contact) }}>Cancel</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="border-[var(--cc-glass-border)] text-[var(--cc-text-secondary)]">Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)} className="border-[var(--cc-glass-border)] text-[var(--cc-text-secondary)]">
                    <Mail className="h-3.5 w-3.5 mr-1" /> Draft Email
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} className="text-red-400 hover:text-red-300 ml-auto">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>

            <Separator className="bg-[var(--cc-divider)]" />

            {/* Contact details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[var(--cc-text-muted)] text-[10px] uppercase tracking-wider">Email</Label>
                {editing ? (
                  <Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className={`mt-1 ${inputClass}`} />
                ) : (
                  <p className="text-sm text-[var(--cc-text-secondary)]">{contact.email || '—'}</p>
                )}
              </div>
              <div>
                <Label className="text-[var(--cc-text-muted)] text-[10px] uppercase tracking-wider">Phone</Label>
                {editing ? (
                  <Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className={`mt-1 ${inputClass}`} />
                ) : (
                  <p className="text-sm text-[var(--cc-text-secondary)]">{contact.phone || '—'}</p>
                )}
              </div>
            </div>

            {/* Brief */}
            <div className="p-3 rounded-lg bg-[var(--cc-glass-bg)] border border-[var(--cc-glass-border)]">
              <h4 className="text-xs font-medium text-[var(--cc-text-primary)] mb-2">Property Brief</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[var(--cc-text-muted)]">Asset Type</span>
                  {editing ? (
                    <Input value={form.asset_type || ''} onChange={e => setForm({ ...form, asset_type: e.target.value })} className={`mt-0.5 h-7 text-xs ${inputClass}`} />
                  ) : (
                    <p className="text-[var(--cc-text-secondary)]">{contact.asset_type || '—'}</p>
                  )}
                </div>
                <div>
                  <span className="text-[var(--cc-text-muted)]">Budget</span>
                  <p className="text-[var(--cc-text-secondary)]">
                    {formatBudget(contact.budget_min)} – {formatBudget(contact.budget_max)}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--cc-text-muted)]">Fee</span>
                  {editing ? (
                    <Input type="number" step="0.1" value={form.fee_percentage || ''} onChange={e => setForm({ ...form, fee_percentage: Number(e.target.value) })} className={`mt-0.5 h-7 text-xs ${inputClass}`} />
                  ) : (
                    <p className="text-[var(--cc-text-secondary)]">{contact.fee_percentage ? `${contact.fee_percentage}%` : '—'}</p>
                  )}
                </div>
              </div>
              {editing ? (
                <div className="mt-2">
                  <Textarea value={form.brief_notes || ''} onChange={e => setForm({ ...form, brief_notes: e.target.value })} placeholder="Brief notes..." className={`text-xs min-h-[40px] ${inputClass}`} />
                </div>
              ) : contact.brief_notes ? (
                <p className="text-xs text-[var(--cc-text-tertiary)] mt-2">{contact.brief_notes}</p>
              ) : null}
            </div>

            {/* Notes */}
            <div>
              <Label className="text-[var(--cc-text-muted)] text-[10px] uppercase tracking-wider">Notes</Label>
              {editing ? (
                <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className={`mt-1 ${inputClass} min-h-[60px]`} />
              ) : (
                <p className="text-sm text-[var(--cc-text-secondary)] mt-1">{contact.notes || '—'}</p>
              )}
            </div>

            <Separator className="bg-[var(--cc-divider)]" />

            {/* Document links */}
            <div>
              <h4 className="text-xs font-medium text-[var(--cc-text-primary)] mb-2 flex items-center gap-1">
                <LinkIcon className="h-3 w-3" /> Documents
              </h4>
              {docLinks.map(dl => (
                <div key={dl.id} className="flex items-center gap-2 py-1.5">
                  <a href={dl.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--cc-accent)] hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> {dl.title}
                  </a>
                  <button onClick={() => { deleteDocumentLink(dl.id); getDocumentLinks('contact', contact.id).then(setDocLinks) }} className="text-[var(--cc-text-muted)] hover:text-red-400 ml-auto">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Input placeholder="Title" value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} className={`h-7 text-xs flex-1 ${inputClass}`} />
                <Input placeholder="URL" value={newDocUrl} onChange={e => setNewDocUrl(e.target.value)} className={`h-7 text-xs flex-1 ${inputClass}`} />
                <Button size="sm" variant="ghost" onClick={handleAddDocLink} className="h-7 px-2"><Plus className="h-3 w-3" /></Button>
              </div>
            </div>

            <Separator className="bg-[var(--cc-divider)]" />

            {/* Activity */}
            <ActivityTimeline entityType="contact" entityId={contact.id} userId={userId} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Email sheet */}
      <DraftEmailSheet open={emailOpen} onClose={() => setEmailOpen(false)} contact={contact} userId={userId} />

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-[var(--cc-surface)] border-[var(--cc-glass-border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--cc-text-primary)]">Delete Contact</DialogTitle>
            <DialogDescription className="text-[var(--cc-text-tertiary)]">
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
