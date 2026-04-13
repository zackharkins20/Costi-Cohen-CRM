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
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/status-badge'
import { ActivityTimeline } from '@/components/activity/activity-timeline'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  updateTask,
  deleteTask,
  getSubtasks,
  createTask,
  getDeals,
  getUsers,
} from '@/lib/queries'
import {
  TASK_STATUSES,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type Deal,
  type User,
} from '@/lib/types'
import { Trash2, Plus, CheckCircle, Circle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  task: Task | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
  userId?: string
}

export function TaskDetailModal({ task, open, onClose, onUpdated, userId }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Task>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [deals, setDeals] = useState<Deal[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (task && open) {
      setForm(task)
      getSubtasks(task.id).then(setSubtasks)
      getDeals().then(setDeals)
      getUsers().then(setUsers)
    }
  }, [task, open])

  if (!task) return null

  const handleSave = async () => {
    const { deal, assigned_user, ...rest } = form as Task
    await updateTask(task.id, rest)
    setEditing(false)
    onUpdated()
  }

  const handleDelete = async () => {
    await deleteTask(task.id)
    setConfirmDelete(false)
    onClose()
    onUpdated()
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return
    await createTask({
      title: newSubtaskTitle,
      description: null,
      status: 'todo',
      priority: task.priority,
      type: task.type,
      deal_id: task.deal_id,
      assigned_to: task.assigned_to,
      due_date: null,
      parent_task_id: task.id,
      created_by: userId || '',
    })
    setNewSubtaskTitle('')
    getSubtasks(task.id).then(setSubtasks)
  }

  const handleToggleSubtask = async (subtask: Task) => {
    const newStatus: TaskStatus = subtask.status === 'done' ? 'todo' : 'done'
    await updateTask(subtask.id, { status: newStatus })
    setSubtasks(prev =>
      prev.map(s => s.id === subtask.id ? { ...s, status: newStatus } : s)
    )
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    await deleteTask(subtaskId)
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId))
  }

  const subtaskDone = subtasks.filter(s => s.status === 'done').length
  const subtaskTotal = subtasks.length
  const subtaskPct = subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : 0

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <span className="block">{task.title}</span>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-5 space-y-5 px-1">
            {/* Status and priority badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <TaskStatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.due_date && (
                <span className="text-xs text-cc-text-muted flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.due_date), 'MMM d, yyyy')}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(task) }}>Cancel</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(true)}
                    className="text-cc-destructive hover:text-cc-text-primary ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>

            <Separator className="bg-cc-border" />

            {/* Editable fields */}
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Title</Label>
                  <Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Status</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as TaskStatus })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Priority</Label>
                    <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v as TaskPriority })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Due Date</Label>
                    <Input type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value || null })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Assignee</Label>
                    <Select value={form.assigned_to || ''} onValueChange={v => setForm({ ...form, assigned_to: v || null })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Linked Deal</Label>
                  <Select value={form.deal_id || ''} onValueChange={v => setForm({ ...form, deal_id: v || null })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      {deals.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Description</Label>
                  <Textarea
                    value={form.description || ''}
                    onChange={e => setForm({ ...form, description: e.target.value || null })}
                    className="mt-1 min-h-[60px]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-cc-text-muted">Assignee</span>
                    <p className="text-cc-text-secondary">
                      {task.assigned_user?.full_name || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-cc-text-muted">Deal</span>
                    <p className="text-cc-text-secondary">
                      {(task.deal as { title: string } | null)?.title || 'None'}
                    </p>
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-cc-text-secondary">{task.description}</p>
                )}
              </div>
            )}

            <Separator className="bg-cc-border" />

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-cc-text-primary">
                  Subtasks
                  {subtaskTotal > 0 && (
                    <span className="ml-2 text-cc-text-muted">
                      {subtaskDone}/{subtaskTotal}
                    </span>
                  )}
                </h4>
              </div>

              {/* Progress bar */}
              {subtaskTotal > 0 && (
                <div className="mb-3">
                  <div className="h-1.5 w-full bg-cc-surface-2 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-cc-text-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${subtaskPct}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Subtask list */}
              <div className="space-y-0">
                <AnimatePresence>
                  {subtasks.map(st => (
                    <motion.div
                      key={st.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 py-2 border-b border-cc-border last:border-0 group"
                    >
                      <button onClick={() => handleToggleSubtask(st)} className="flex-shrink-0">
                        {st.status === 'done' ? (
                          <CheckCircle className="h-4 w-4 text-cc-text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-cc-text-muted hover:text-cc-text-secondary transition-colors" />
                        )}
                      </button>
                      <span className={`text-sm flex-1 ${st.status === 'done' ? 'line-through text-cc-text-muted' : 'text-cc-text-secondary'}`}>
                        {st.title}
                      </span>
                      <button
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-cc-text-muted hover:text-cc-text-primary" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Add subtask input */}
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a subtask..."
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask() }}
                  className="h-8 text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddSubtask}
                  className="h-8 px-2 hover:text-cc-text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <Separator className="bg-cc-border" />

            {/* Activity */}
            <ActivityTimeline entityType="task" entityId={task.id} userId={userId} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{task.title}&quot;? This will also delete all subtasks. This action cannot be undone.
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
