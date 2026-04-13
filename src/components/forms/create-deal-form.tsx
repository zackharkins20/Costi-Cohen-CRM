'use client'

import { useState, useEffect } from 'react'
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
import { createDeal, getContacts, logActivity } from '@/lib/queries'
import { notifyAllUsers } from '@/lib/notifications'
import { executeWorkflows } from '@/lib/workflows'
import { PROPERTY_STAGES, type PropertyStage, type Deal, type Contact } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (deal: Deal) => void
  userId?: string
  defaultContactId?: string
}

export function CreateDealForm({ open, onClose, onCreated, userId, defaultContactId }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [form, setForm] = useState({
    title: '',
    stage: 'active_leads' as PropertyStage,
    contact_id: '',
    deal_value: '',
    fee_percentage: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      getContacts().then(setContacts)
      if (defaultContactId) {
        setForm(prev => ({ ...prev, contact_id: defaultContactId }))
      }
    }
  }, [open, defaultContactId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    const dealValue = form.deal_value ? Number(form.deal_value) : null
    const feePct = form.fee_percentage ? Number(form.fee_percentage) : null
    const feeAmount = dealValue && feePct ? (dealValue * feePct) / 100 : null

    const deal = await createDeal({
      title: form.title,
      stage: form.stage,
      contact_id: form.contact_id || null,
      deal_value: dealValue,
      fee_percentage: feePct,
      fee_amount: feeAmount,
      description: form.description || null,
      created_by: userId || '',
      assigned_to: userId || null,
    })
    if (deal) {
      await logActivity({
        entity_type: 'deal',
        entity_id: deal.id,
        action: 'note',
        description: `Deal "${deal.title}" created`,
        created_by: userId,
      })
      await notifyAllUsers({
        title: 'New Deal Created',
        message: `Deal "${deal.title}" has been created`,
        entity_type: 'deal',
        entity_id: deal.id,
      })
      executeWorkflows({
        trigger_type: 'deal_created',
        deal: { id: deal.id, title: deal.title, stage: deal.stage, contact_id: form.contact_id || undefined },
        user: { id: userId || '', name: '' },
      })
      onCreated(deal)
    }
    setForm({ title: '', stage: 'active_leads', contact_id: '', deal_value: '', fee_percentage: '', description: '' })
    setLoading(false)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New Deal</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-5 px-1">
          <div>
            <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Title *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. 42 Oxford St Acquisition" className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Contact</Label>
              <Select value={form.contact_id} onValueChange={v => setForm({ ...form, contact_id: v ?? '' })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent>
                  {contacts.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Deal Value ($)</Label>
              <Input type="number" value={form.deal_value} onChange={e => setForm({ ...form, deal_value: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Fee %</Label>
              <Input type="number" step="0.1" value={form.fee_percentage} onChange={e => setForm({ ...form, fee_percentage: e.target.value })} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1.5 min-h-[60px]" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Deal'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
