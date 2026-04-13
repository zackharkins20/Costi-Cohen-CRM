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
import { updateDeal, updateDealPropertyDetails, deleteDeal, logActivity } from '@/lib/queries'
import { notifyAllUsers } from '@/lib/notifications'
import { DocumentManager } from '@/components/documents/document-manager'
import { UpcomingEvents } from '@/components/events/upcoming-events'
import { EmailHistory } from '@/components/email/email-history'
import { PROPERTY_STAGES, type PropertyStage, type Deal } from '@/lib/types'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Props {
  deal: Deal | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
  userId?: string
}

export function DealDetailModal({ deal, open, onClose, onUpdated, userId }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Deal>>({})
  const [propForm, setPropForm] = useState<Record<string, string | null>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (deal) {
      setForm(deal)
      setPropForm({
        mandate_brief: deal.property_details?.mandate_brief || '',
        purchase_price: deal.property_details?.purchase_price?.toString() || '',
        gst_amount: deal.property_details?.gst_amount?.toString() || '',
        exchange_date: deal.property_details?.exchange_date || '',
        settlement_date: deal.property_details?.settlement_date || '',
      })
    }
  }, [deal])

  if (!deal) return null

  const handleSave = async () => {
    const dealValue = form.deal_value ? Number(form.deal_value) : null
    const feePct = form.fee_percentage ? Number(form.fee_percentage) : null
    const feeAmount = dealValue && feePct ? (dealValue * feePct) / 100 : null

    await updateDeal(deal.id, { ...form, fee_amount: feeAmount })
    await updateDealPropertyDetails(deal.id, {
      mandate_brief: propForm.mandate_brief || null,
      purchase_price: propForm.purchase_price ? Number(propForm.purchase_price) : null,
      gst_amount: propForm.gst_amount ? Number(propForm.gst_amount) : null,
      exchange_date: propForm.exchange_date || null,
      settlement_date: propForm.settlement_date || null,
    })

    if (form.stage !== deal.stage) {
      await logActivity({
        entity_type: 'deal',
        entity_id: deal.id,
        action: 'stage_change',
        description: `Stage changed from ${deal.stage} to ${form.stage}`,
        created_by: userId,
      })
      const stageLabel = PROPERTY_STAGES.find(s => s.key === form.stage)?.label ?? form.stage
      await notifyAllUsers({
        title: 'Deal Stage Changed',
        message: `"${deal.title}" moved to ${stageLabel}`,
        entity_type: 'deal',
        entity_id: deal.id,
      })
    }
    setEditing(false)
    onUpdated()
  }

  const handleDelete = async () => {
    await deleteDeal(deal.id)
    setConfirmDelete(false)
    onClose()
    onUpdated()
  }

  const formatCurrency = (n: number | null) => {
    if (!n) return '—'
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    return `$${n.toLocaleString()}`
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{deal.title}</SheetTitle>
          </SheetHeader>

          <div className="mt-5 space-y-5 px-1">
            <div className="flex items-center gap-2">
              <StageBadge stage={deal.stage} />
              {deal.contact && (
                <span className="text-xs text-cc-text-secondary">{deal.contact.name}</span>
              )}
            </div>

            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(deal) }}>Cancel</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} className="text-cc-destructive hover:text-cc-text-primary ml-auto">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>

            <Separator className="bg-cc-border" />

            {/* Deal fields */}
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Title</Label>
                  <Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Stage</Label>
                  <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v as PropertyStage })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Deal Value</Label>
                    <Input type="number" value={form.deal_value || ''} onChange={e => setForm({ ...form, deal_value: Number(e.target.value) })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Fee %</Label>
                    <Input type="number" step="0.1" value={form.fee_percentage || ''} onChange={e => setForm({ ...form, fee_percentage: Number(e.target.value) })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Description</Label>
                  <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 min-h-[60px]" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-cc-text-muted">Deal Value</span>
                  <p className="text-cc-text-primary font-semibold">{formatCurrency(deal.deal_value)}</p>
                </div>
                <div>
                  <span className="text-cc-text-muted">Fee %</span>
                  <p className="text-cc-text-primary">{deal.fee_percentage ? `${deal.fee_percentage}%` : '—'}</p>
                </div>
                <div>
                  <span className="text-cc-text-muted">Est. Fee</span>
                  <p className="text-cc-text-primary font-semibold">{formatCurrency(deal.fee_amount)}</p>
                </div>
              </div>
            )}

            {deal.description && !editing && (
              <p className="text-sm text-cc-text-secondary">{deal.description}</p>
            )}

            <Separator className="bg-cc-border" />

            {/* Property details */}
            <div className="p-4 bg-cc-surface-2 border border-cc-border">
              <h4 className="text-xs font-medium text-cc-text-primary mb-3">Property Details</h4>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-cc-text-muted text-[10px]">Mandate Brief</Label>
                    <Textarea value={propForm.mandate_brief || ''} onChange={e => setPropForm({ ...propForm, mandate_brief: e.target.value })} className="text-xs min-h-[40px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-cc-text-muted text-[10px]">Exchange Date</Label>
                      <Input type="date" value={propForm.exchange_date || ''} onChange={e => setPropForm({ ...propForm, exchange_date: e.target.value })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-cc-text-muted text-[10px]">Settlement Date</Label>
                      <Input type="date" value={propForm.settlement_date || ''} onChange={e => setPropForm({ ...propForm, settlement_date: e.target.value })} className="h-7 text-xs" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  {deal.property_details?.mandate_brief && (
                    <p className="text-cc-text-secondary">{deal.property_details.mandate_brief}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <span className="text-cc-text-muted">Exchange</span>
                      <p className="text-cc-text-secondary">{deal.property_details?.exchange_date || '—'}</p>
                    </div>
                    <div>
                      <span className="text-cc-text-muted">Settlement</span>
                      <p className="text-cc-text-secondary">{deal.property_details?.settlement_date || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-cc-border" />

            {/* Documents */}
            <DocumentManager entityType="deal" entityId={deal.id} userId={userId} />

            <Separator className="bg-cc-border" />

            {/* Upcoming Events */}
            <UpcomingEvents entityType="deal" entityId={deal.id} />

            <Separator className="bg-cc-border" />

            {/* Email History */}
            <EmailHistory entityType="deal" entityId={deal.id} />

            <Separator className="bg-cc-border" />

            {/* Activity */}
            <ActivityTimeline entityType="deal" entityId={deal.id} userId={userId} />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deal.title}&quot;? This action cannot be undone.
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
