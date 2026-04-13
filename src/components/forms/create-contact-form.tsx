'use client'

import { useState } from 'react'
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { createContact, logActivity } from '@/lib/queries'
import { notifyAllUsers } from '@/lib/notifications'
import { executeWorkflows } from '@/lib/workflows'
import { PROPERTY_STAGES, BUYER_TYPES, type PropertyStage, type BuyerType, type Contact } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (contact: Contact) => void
  userId?: string
}

export function CreateContactForm({ open, onClose, onCreated, userId }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    type: 'client' as 'client' | 'other',
    stage: 'active_leads' as PropertyStage,
    buyer_type: '',
    asset_type: '',
    budget_min: '',
    budget_max: '',
    fee_percentage: '',
    brief_notes: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    const contact = await createContact({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      type: form.type,
      stage: form.stage,
      buyer_type: (form.buyer_type || null) as BuyerType | null,
      asset_type: form.asset_type || null,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      fee_percentage: form.fee_percentage ? Number(form.fee_percentage) : null,
      brief_notes: form.brief_notes || null,
      notes: form.notes || null,
      created_by: userId || '',
    })
    if (contact) {
      await logActivity({
        entity_type: 'contact',
        entity_id: contact.id,
        action: 'note',
        description: `Contact "${contact.name}" created`,
        created_by: userId,
      })
      await notifyAllUsers({
        title: 'New Contact Added',
        message: `Contact "${contact.name}" has been added`,
        entity_type: 'contact',
        entity_id: contact.id,
      })
      executeWorkflows({
        trigger_type: 'contact_created',
        contact: { id: contact.id, name: contact.name, email: contact.email || undefined },
        user: { id: userId || '', name: '' },
      })
      onCreated(contact)
    }
    setForm({ name: '', email: '', phone: '', company: '', type: 'client', stage: 'active_leads', buyer_type: '', asset_type: '', budget_min: '', budget_max: '', fee_percentage: '', brief_notes: '', notes: '' })
    setLoading(false)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add Contact</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-5 px-1">
          <div>
            <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Phone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Company</Label>
            <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as 'client' | 'other' })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Stage</Label>
              <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v as PropertyStage })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_STAGES.map(s => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Buyer Type</Label>
              <Select value={form.buyer_type ?? ''} onValueChange={v => setForm({ ...form, buyer_type: v || '' })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {BUYER_TYPES.map(b => (
                    <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Asset Type</Label>
              <Input value={form.asset_type} onChange={e => setForm({ ...form, asset_type: e.target.value })} placeholder="e.g. Residential, Commercial" className="mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Budget Min</Label>
              <Input type="number" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Budget Max</Label>
              <Input type="number" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Fee %</Label>
              <Input type="number" step="0.1" value={form.fee_percentage} onChange={e => setForm({ ...form, fee_percentage: e.target.value })} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Brief Notes</Label>
            <Textarea value={form.brief_notes} onChange={e => setForm({ ...form, brief_notes: e.target.value })} className="mt-1.5 min-h-[60px]" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Contact'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
