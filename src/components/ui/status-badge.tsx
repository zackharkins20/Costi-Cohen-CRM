import { cn } from '@/lib/utils'
import { PROPERTY_STAGES, TASK_STATUSES, type PropertyStage, type TaskStatus, type TaskPriority } from '@/lib/types'

const stageColors: Record<PropertyStage, string> = {
  lead: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  initial_call: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  property_search: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  due_diligence: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  exchange: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  fees_collected: 'bg-green-500/15 text-green-300 border-green-500/20',
}

const taskStatusColors: Record<TaskStatus, string> = {
  todo: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  review: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  done: 'bg-green-500/15 text-green-300 border-green-500/20',
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/15 text-red-400 border-red-500/20',
}

export function StageBadge({ stage, className }: { stage: PropertyStage; className?: string }) {
  const stageInfo = PROPERTY_STAGES.find(s => s.key === stage)
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      stageColors[stage] || 'bg-gray-500/15 text-gray-400',
      className
    )}>
      {stageInfo?.label || stage}
    </span>
  )
}

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const statusInfo = TASK_STATUSES.find(s => s.key === status)
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      taskStatusColors[status],
      className
    )}>
      {statusInfo?.label || status}
    </span>
  )
}

export function PriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize',
      priorityColors[priority],
      className
    )}>
      {priority}
    </span>
  )
}
