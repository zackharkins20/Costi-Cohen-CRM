'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { GlassCard } from '@/components/ui/glass-card'
import { PriorityBadge } from '@/components/ui/status-badge'
import { CreateTaskForm } from '@/components/forms/create-task-form'
import { TaskDetailModal } from '@/components/tasks/task-detail-modal'
import { TaskFilterBar, type TaskFilters } from '@/components/tasks/task-filter-bar'
import { getTasks, updateTask, getCurrentUser, getUsers, getSubtaskCounts } from '@/lib/queries'
import { notifyAllUsers } from '@/lib/notifications'
import { executeWorkflows } from '@/lib/workflows'
import { TASK_STATUSES, type Task, type TaskStatus, type User, type SubtaskCounts } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Plus, CheckSquare, Calendar } from 'lucide-react'
import { format, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import type { DropResult } from '@hello-pangea/dnd'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [userId, setUserId] = useState<string>()
  const [users, setUsers] = useState<User[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [subtaskCountsMap, setSubtaskCountsMap] = useState<Record<string, SubtaskCounts>>({})
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    priorities: [],
    dueDateFilter: 'all',
    assignee: 'all',
  })

  const load = () => {
    getTasks().then(data => {
      setTasks(data)
      const ids = data.map(t => t.id)
      if (ids.length > 0) {
        getSubtaskCounts(ids).then(setSubtaskCountsMap)
      }
    })
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
    getUsers().then(setUsers)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const now = new Date()
    return tasks.filter(t => {
      // Search
      if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      // Priority
      if (filters.priorities.length > 0 && !filters.priorities.includes(t.priority)) {
        return false
      }
      // Assignee
      if (filters.assignee !== 'all' && t.assigned_to !== filters.assignee) {
        return false
      }
      // Due date
      if (filters.dueDateFilter !== 'all' && t.due_date) {
        const due = new Date(t.due_date)
        switch (filters.dueDateFilter) {
          case 'overdue':
            if (!isBefore(due, now) || t.status === 'done') return false
            break
          case 'this_week': {
            const ws = startOfWeek(now, { weekStartsOn: 1 })
            const we = endOfWeek(now, { weekStartsOn: 1 })
            if (isBefore(due, ws) || isAfter(due, we)) return false
            break
          }
          case 'this_month': {
            const ms = startOfMonth(now)
            const me = endOfMonth(now)
            if (isBefore(due, ms) || isAfter(due, me)) return false
            break
          }
        }
      } else if (filters.dueDateFilter !== 'all' && !t.due_date) {
        return false
      }
      return true
    })
  }, [tasks, filters])

  const columns = TASK_STATUSES.map(status => {
    const items = filtered.filter(t => t.status === status.key)
    const hasOverdue = items.some(t => {
      if (!t.due_date || t.status === 'done') return false
      return isBefore(new Date(t.due_date), new Date())
    })
    return {
      id: status.key,
      title: status.label,
      items,
      isDone: status.key === 'done',
      hasOverdue,
    }
  })

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const taskId = result.draggableId
    const newStatus = result.destination.droppableId as TaskStatus
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    )
    await updateTask(taskId, { status: newStatus })
    const statusLabel = TASK_STATUSES.find(s => s.key === newStatus)?.label ?? newStatus
    await notifyAllUsers({
      title: 'Task Status Changed',
      message: `"${task.title}" moved to ${statusLabel}`,
      entity_type: 'task',
      entity_id: taskId,
    })
    if (newStatus === 'done') {
      executeWorkflows({
        trigger_type: 'task_completed',
        task: { id: taskId, title: task.title, assigned_to: task.assigned_to || undefined },
        user: { id: userId || '', name: '' },
      })
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  return (
    <div>
      <PageHeader title="Tasks" description={`${tasks.length} tasks`}>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Task
        </Button>
      </PageHeader>

      <TaskFilterBar filters={filters} onChange={setFilters} users={users} />

      <KanbanBoard
        columns={columns}
        onDragEnd={handleDragEnd}
        getItemId={t => t.id}
        renderCard={(task) => {
          const counts = subtaskCountsMap[task.id]
          return (
            <GlassCard className="p-3" onClick={() => handleTaskClick(task)}>
              <p className="text-sm font-medium text-cc-text-primary mb-1.5">{task.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <PriorityBadge priority={task.priority} />
                {task.due_date && (
                  <span className={`text-[10px] flex items-center gap-0.5 ${
                    isBefore(new Date(task.due_date), new Date()) && task.status !== 'done'
                      ? 'text-cc-text-primary font-semibold'
                      : 'text-cc-text-muted'
                  }`}>
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.due_date), 'MMM d')}
                  </span>
                )}
              </div>
              {counts && counts.total > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-cc-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cc-accent rounded-full transition-all"
                      style={{ width: `${Math.round((counts.done / counts.total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-cc-text-muted">{counts.done}/{counts.total}</span>
                </div>
              )}
              {task.deal && (
                <p className="text-[10px] text-cc-text-secondary mt-1.5 truncate">
                  <CheckSquare className="h-3 w-3 inline mr-0.5" />
                  {(task.deal as { title: string }).title}
                </p>
              )}
            </GlassCard>
          )
        }}
        columnHeaderExtra={(column) => {
          const col = columns.find(c => c.id === column.id)
          if (!col) return null
          return (
            <span className="flex items-center gap-1">
              {col.isDone && (
                <span className="w-2 h-2 rounded-full bg-[#4A5D52] inline-block" />
              )}
              {col.hasOverdue && !col.isDone && (
                <span className="w-2 h-2 rounded-full bg-cc-text-muted inline-block" />
              )}
            </span>
          )
        }}
      />

      <CreateTaskForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => load()}
        userId={userId}
      />

      <TaskDetailModal
        task={selectedTask}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={load}
        userId={userId}
      />
    </div>
  )
}
