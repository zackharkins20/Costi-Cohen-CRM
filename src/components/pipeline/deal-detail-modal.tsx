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
import { updateDeal, updateDealPropertyDetails, deleteDeal, logActivity } from '@/lib/queries'
import { notifyAllUsers } from '@/lib/notifications'
import { DocumentManager } from '@/components/documents/document-manager'
import { UpcomingEvents } from '@/components/events/upcoming-events'
import { EmailHistory } from '@/components/email/email-history'
import { PROPERTY_STAGES, type PropertyStage, type Deal } from '@/lib/types'
import { Pencil, Trash2, Building2, User } from 'lucide-react'
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

const sectionLabel = "text-[12px] font-medium uppercase tracking-[0.05em] text-cc-text-muted mb-3"

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

  const stageInfo = PROPERTY_STAGES.find(s => s.key === deal.stage)

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-[450px] p-0">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <SheetTitle className="flex-1 min-w-0">
                <span className="block text-lg font-bold text-cc-text-primary truncate">{deal.title}</span>
                <div className="flex items-center gap-2 mt-1">
                  {deal.contact && (
                    <span className="flex items-center gap-1 text-xs font-normal text-cc-text-secondary">
                      <User className="h-3 w-3" /> {deal.contact.name}
                    </span>
                  )}
                </div>
              </SheetTitle>
              <div className="flex gap-1.5 flex-shrink-0 mt-1">
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8 px-3 text-xs rounded-lg">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="px-6 pb-6 space-y-6">
            {/* Edit mode bar */}
            {editing && (
              <div className="space-y-4 p-4 bg-cc-surface-2 rounded-xl border border-cc-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cc-text-secondary">Editing deal</span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} className="h-7 text-xs rounded-lg">Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(deal) }} className="h-7 text-xs rounded-lg">Cancel</Button>
                  </div>
                </div>
                <div>
                  <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Title</Label>
                  <Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" />
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
            )}

            {/* CONTACT INFO - deal value summary */}
            {!editing && (
              <div>
                <h4 className={sectionLabel}>Deal Info</h4>
                <div className="rounded-xl border border-cc-border bg-cc-surface p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">Deal Value</span>
                      <span className="text-sm text-cc-text-primary font-semibold">{formatCurrency(deal.deal_value)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">Fee %</span>
                      <span className="text-sm text-cc-text-primary">{deal.fee_percentage ? `${deal.fee_percentage}%` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">Est. Fee</span>
                      <span className="text-sm text-cc-text-primary font-semibold">{formatCurrency(deal.fee_amount)}</span>
                    </div>
                  </div>
                  {deal.description && (
                    <p className="text-sm text-cc-text-secondary mt-3 pt-3 border-t border-cc-border">{deal.description}</p>
                  )}
                </div>
              </div>
            )}

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
                  <span className="text-sm text-cc-text-primary">{stageInfo?.label || deal.stage}</span>
                </div>
              )}
            </div>

            {/* BRIEF - from deal_property_details */}
            <div>
              <h4 className={sectionLabel}>Brief</h4>
              <div className="rounded-xl p-4 border border-cc-border" style={{ background: 'var(--cc-surface-2)' }}>
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted">Mandate Brief</Label>
                      <Textarea value={propForm.mandate_brief || ''} onChange={e => setPropForm({ ...propForm, mandate_brief: e.target.value })} className="text-xs min-h-[40px] mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted">Purchase Price</Label>
                        <Input type="number" value={propForm.purchase_price || ''} onChange={e => setPropForm({ ...propForm, purchase_price: e.target.value })} className="h-7 text-xs mt-1" />
                      </div>
                      <div>
                        <Label className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted">GST Amount</Label>
                        <Input type="number" value={propForm.gst_amount || ''} onChange={e => setPropForm({ ...propForm, gst_amount: e.target.value })} className="h-7 text-xs mt-1" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted">Exchange Date</Label>
                        <Input type="date" value={propForm.exchange_date || ''} onChange={e => setPropForm({ ...propForm, exchange_date: e.target.value })} className="h-7 text-xs mt-1" />
                      </div>
                      <div>
                        <Label className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted">Settlement Date</Label>
                        <Input type="date" value={propForm.settlement_date || ''} onChange={e => setPropForm({ ...propForm, settlement_date: e.target.value })} className="h-7 text-xs mt-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">Purchase Price</span>
                        <span className="text-sm text-cc-text-primary font-medium">{formatCurrency(deal.property_details?.purchase_price ?? null)}</span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">GST</span>
                        <span className="text-sm text-cc-text-primary">{formatCurrency(deal.property_details?.gst_amount ?? null)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">Exchange</span>
                        <span className="text-sm text-cc-text-primary">{deal.property_details?.exchange_date || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">Settlement</span>
                        <span className="text-sm text-cc-text-primary">{deal.property_details?.settlement_date || '—'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.05em] text-cc-text-muted block mb-1">Mandate Brief</span>
                      <span className="text-sm text-cc-text-secondary">{deal.property_details?.mandate_brief || '—'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* NOTES - using description */}
            {!editing && deal.description && (
              <div>
                <h4 className={sectionLabel}>Notes</h4>
                <div className="rounded-xl border border-cc-border bg-cc-surface p-4">
                  <p className="text-sm text-cc-text-secondary">{deal.description}</p>
                </div>
              </div>
            )}

            {/* DOCUMENTS */}
            <div>
              <h4 className={sectionLabel}>Documents</h4>
              <div className="rounded-xl border border-cc-border bg-cc-surface p-4">
                <DocumentManager entityType="deal" entityId={deal.id} userId={userId} />
              </div>
            </div>

            {/* EMAILS */}
            <div>
              <h4 className={sectionLabel}>Emails</h4>
              <div className="rounded-xl border border-cc-border bg-cc-surface p-4">
                <EmailHistory entityType="deal" entityId={deal.id} />
              </div>
            </div>

            {/* UPCOMING EVENTS */}
            <div>
              <h4 className={sectionLabel}>Upcoming Events</h4>
              <div className="rounded-xl border border-cc-border bg-cc-surface p-4">
                <UpcomingEvents entityType="deal" entityId={deal.id} />
              </div>
            </div>

            {/* ACTIVITY */}
            <div>
              <h4 className={sectionLabel}>Activity</h4>
              <div className="rounded-xl border border-cc-border bg-cc-surface p-4">
                <ActivityTimeline entityType="deal" entityId={deal.id} userId={userId} />
              </div>
            </div>

            {/* DELETE */}
            <div className="pt-2">
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-cc-destructive hover:text-cc-text-primary transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete deal
              </button>
            </div>
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
