import { cn } from '@/lib/utils'
import { PROPERTY_STAGES, TASK_STATUSES, type PropertyStage, type TaskStatus, type TaskPriority } from '@/lib/types'

/* Monochrome badges — no color coding */
const stageColors: Record<PropertyStage, string> = {
  lead: 'bg-transparent text-cc-text-secondary border-cc-border-hover',
  initial_call: 'bg-transparent text-cc-text-secondary border-cc-border-hover',
  property_search: 'bg-transparent text-cc-text-secondary border-cc-text-muted',
  due_diligence: 'bg-transparent text-cc-text-secondary border-cc-text-muted',
  exchange: 'bg-transparent text-cc-text-primary border-cc-btn-border',
  fees_collected: 'bg-transparent text-cc-text-primary border-cc-btn-border',
}

const taskStatusColors: Record<TaskStatus, string> = {
  todo: 'bg-transparent text-cc-text-secondary border-cc-border-hover',
  in_progress: 'bg-transparent text-cc-text-secondary border-cc-text-muted',
  review: 'bg-transparent text-cc-text-primary border-cc-text-muted',
  done: 'bg-transparent text-cc-text-primary border-cc-btn-border',
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-transparent text-cc-text-muted border-cc-border-hover',
  medium: 'bg-transparent text-cc-text-secondary border-cc-border-hover',
  high: 'bg-transparent text-cc-text-primary border-cc-text-muted',
  urgent: 'bg-transparent text-cc-text-primary border-cc-btn-border',
}

export function StageBadge({ stage, className }: { stage: PropertyStage; className?: string }) {
  const stageInfo = PROPERTY_STAGES.find(s => s.key === stage)
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium border uppercase tracking-[0.04em]',
      stageColors[stage] || 'bg-transparent text-cc-text-secondary border-cc-border-hover',
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
