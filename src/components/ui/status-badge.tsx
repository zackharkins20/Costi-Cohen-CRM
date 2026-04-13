import { cn } from '@/lib/utils'
import { PROPERTY_STAGES, TASK_STATUSES, type PropertyStage, type TaskStatus, type TaskPriority } from '@/lib/types'

/* Monochrome badges — no color coding */
const stageColors: Record<PropertyStage, string> = {
  lead: 'bg-transparent text-[#A0A7AB] border-[#333333]',
  initial_call: 'bg-transparent text-[#A0A7AB] border-[#333333]',
  property_search: 'bg-transparent text-[#A0A7AB] border-[#555555]',
  due_diligence: 'bg-transparent text-[#A0A7AB] border-[#555555]',
  exchange: 'bg-transparent text-white border-white',
  fees_collected: 'bg-transparent text-white border-white',
}

const taskStatusColors: Record<TaskStatus, string> = {
  todo: 'bg-transparent text-[#A0A7AB] border-[#333333]',
  in_progress: 'bg-transparent text-[#A0A7AB] border-[#555555]',
  review: 'bg-transparent text-white border-[#555555]',
  done: 'bg-transparent text-white border-white',
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-transparent text-[#555555] border-[#333333]',
  medium: 'bg-transparent text-[#A0A7AB] border-[#333333]',
  high: 'bg-transparent text-white border-[#555555]',
  urgent: 'bg-transparent text-white border-white',
}

export function StageBadge({ stage, className }: { stage: PropertyStage; className?: string }) {
  const stageInfo = PROPERTY_STAGES.find(s => s.key === stage)
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium border uppercase tracking-[0.04em]',
      stageColors[stage] || 'bg-transparent text-[#A0A7AB] border-[#333333]',
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
      'inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium border uppercase tracking-[0.04em]',
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
      'inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium border capitalize uppercase tracking-[0.04em]',
      priorityColors[priority],
      className
    )}>
      {priority}
    </span>
  )
}
