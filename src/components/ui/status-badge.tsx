import { cn } from '@/lib/utils'
import { PROPERTY_STAGES, TASK_STATUSES, type PropertyStage, type TaskStatus, type TaskPriority } from '@/lib/types'

/* Muted warm tones only — no bright blue/green/red */
const stageColors: Record<PropertyStage, string> = {
  lead: 'bg-[#3a3530]/60 text-[#c4bcb0] border-[#3a3530]',
  initial_call: 'bg-[#3a3530]/60 text-[#b8a890] border-[#3a3530]',
  property_search: 'bg-[#3a3228]/60 text-[#c9a96e] border-[#3a3228]',
  due_diligence: 'bg-[#382e24]/60 text-[#b8924f] border-[#382e24]',
  exchange: 'bg-[#332e24]/60 text-[#a09070] border-[#332e24]',
  fees_collected: 'bg-[#332e24]/60 text-[#8a8068] border-[#332e24]',
}

const taskStatusColors: Record<TaskStatus, string> = {
  todo: 'bg-[#2a2826]/60 text-[#8a8680] border-[#2a2826]',
  in_progress: 'bg-[#3a3228]/60 text-[#c9a96e] border-[#3a3228]',
  review: 'bg-[#382e24]/60 text-[#b8924f] border-[#382e24]',
  done: 'bg-[#332e24]/60 text-[#a09070] border-[#332e24]',
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-[#2a2826]/60 text-[#8a8680] border-[#2a2826]',
  medium: 'bg-[#3a3228]/60 text-[#c9a96e] border-[#3a3228]',
  high: 'bg-[#382e24]/60 text-[#b8924f] border-[#382e24]',
  urgent: 'bg-[#3a2828]/60 text-[#a0705a] border-[#3a2828]',
}

export function StageBadge({ stage, className }: { stage: PropertyStage; className?: string }) {
  const stageInfo = PROPERTY_STAGES.find(s => s.key === stage)
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      stageColors[stage] || 'bg-[#2a2826]/60 text-[#8a8680]',
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
