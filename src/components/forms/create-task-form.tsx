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
import { createTask, getDeals } from '@/lib/queries'
import type { Task, Deal, TaskPriority, TaskType, TaskStatus } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (task: Task) => void
  userId?: string
}

export function CreateTaskForm({ open, onClose, onCreated, userId }: Props) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    type: 'general' as TaskType,
    deal_id: '',
    due_date: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) getDeals().then(setDeals)
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    const task = await createTask({
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      type: form.type,
      deal_id: form.deal_id || null,
      assigned_to: userId || null,
      due_date: form.due_date || null,
      created_by: userId || '',
    })
    if (task) onCreated(task)
    setForm({ title: '', description: '', status: 'todo', priority: 'medium', type: 'general', deal_id: '', due_date: '' })
    setLoading(false)
    onClose()
  }

  const inputClass = 'bg-[var(--cc-surface-2)] border-[var(--cc-border)] text-[var(--cc-text-primary)] placeholder:text-[var(--cc-text-faint)]'

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-[var(--cc-surface)] border-[var(--cc-border)] overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-[var(--cc-text-primary)]">New Task</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-5 px-1">
          <div>
            <Label className="text-[var(--cc-text-muted)] text-xs uppercase tracking-wider">Title *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className={`mt-1.5 ${inputClass}`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[var(--cc-text-muted)] text-xs uppercase tracking-wider">Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v as TaskPriority })}>
                <SelectTrigger className={`mt-1.5 ${inputClass}`}><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[var(--cc-surface)] border-[var(--cc-border)]">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[var(--cc-text-muted)] text-xs uppercase tracking-wider">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as TaskType })}>
                <SelectTrigger className={`mt-1.5 ${inputClass}`}><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[var(--cc-surface)] border-[var(--cc-border)]">
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.type === 'deal' && (
            <div>
              <Label className="text-[var(--cc-text-muted)] text-xs uppercase tracking-wider">Linked Deal</Label>
              <Select value={form.deal_id} onValueChange={v => setForm({ ...form, deal_id: v ?? '' })}>
                <SelectTrigger className={`mt-1.5 ${inputClass}`}><SelectValue placeholder="Select deal" /></SelectTrigger>
                <SelectContent className="bg-[var(--cc-surface)] border-[var(--cc-border)]">
                  {deals.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-[var(--cc-text-muted)] text-xs uppercase tracking-wider">Due Date</Label>
            <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <Label className="text-[var(--cc-text-muted)] text-xs uppercase tracking-wider">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`mt-1.5 ${inputClass} min-h-[60px]`} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#c9a96e] hover:bg-[#b8924f] text-[#0f0e0c] font-medium">
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
