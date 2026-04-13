'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { GlassCard } from '@/components/ui/glass-card'
import { PriorityBadge } from '@/components/ui/status-badge'
import { CreateTaskForm } from '@/components/forms/create-task-form'
import { getTasks, updateTask, getCurrentUser } from '@/lib/queries'
import { TASK_STATUSES, type Task, type TaskStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Plus, CheckSquare, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import type { DropResult } from '@hello-pangea/dnd'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [userId, setUserId] = useState<string>()

  const load = () => {
    getTasks().then(setTasks)
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
  }

  useEffect(() => { load() }, [])

  const columns = TASK_STATUSES.map(status => ({
    id: status.key,
    title: status.label,
    items: tasks.filter(t => t.status === status.key),
  }))

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
  }

  return (
    <div>
      <PageHeader title="Tasks" description={`${tasks.length} tasks`}>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Task
        </Button>
      </PageHeader>

      <KanbanBoard
        columns={columns}
        onDragEnd={handleDragEnd}
        getItemId={t => t.id}
        renderCard={(task) => (
          <GlassCard className="p-3">
            <p className="text-sm font-medium text-white mb-1.5">{task.title}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={task.priority} />
              {task.due_date && (
                <span className="text-[10px] text-[#555555] flex items-center gap-0.5">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.due_date), 'MMM d')}
                </span>
              )}
            </div>
            {task.deal && (
              <p className="text-[10px] text-[#A0A7AB] mt-1.5 truncate">
                <CheckSquare className="h-3 w-3 inline mr-0.5" />
                {(task.deal as { title: string }).title}
              </p>
            )}
          </GlassCard>
        )}
      />

      <CreateTaskForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => load()}
        userId={userId}
      />
    </div>
  )
}
