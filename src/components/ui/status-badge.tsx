'use client'

import { cn } from '@/lib/utils'
import { PROPERTY_STAGES, TASK_STATUSES, type PropertyStage, type TaskStatus, type TaskPriority } from '@/lib/types'
import { getStageColor } from '@/lib/stage-colors'
import { useTheme } from '@/components/theme-provider'

const taskStatusColors: Record<TaskStatus, string> = {
  todo: 'bg-[var(--cc-status-neutral-bg)] text-[var(--cc-status-neutral-text)] border-[var(--cc-status-neutral-border)]',
  in_progress: 'bg-[var(--cc-status-active-bg)] text-[var(--cc-status-active-text)] border-[var(--cc-status-active-border)]',
  review: 'bg-[var(--cc-status-pending-bg)] text-[var(--cc-status-pending-text)] border-[var(--cc-status-pending-border)]',
  done: 'bg-[var(--cc-status-success-bg)] text-[var(--cc-status-success-text)] border-[var(--cc-status-success-border)]',
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-[var(--cc-status-neutral-bg)] text-[var(--cc-status-neutral-text)] border-[var(--cc-status-neutral-border)]',
  medium: 'bg-[var(--cc-status-pending-bg)] text-[var(--cc-status-pending-text)] border-[var(--cc-status-pending-border)]',
  high: 'bg-[var(--cc-status-active-bg)] text-[var(--cc-status-active-text)] border-[var(--cc-status-active-border)]',
  urgent: 'bg-[var(--cc-status-warning-bg)] text-[var(--cc-status-warning-text)] border-[var(--cc-status-warning-border)]',
}

export function StageBadge({ stage, className }: { stage: PropertyStage; className?: string }) {
  const stageInfo = PROPERTY_STAGES.find(s => s.key === stage)
  const { theme } = useTheme()
  const colors = getStageColor(stage, theme === 'dark')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em]',
        className
      )}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.dot }} />
      {stageInfo?.label || stage}
    </span>
  )
}

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const statusInfo = TASK_STATUSES.find(s => s.key === status)
  return (
    <span className={cn(
      'inline-flex items-center rounded-sm px-2.5 py-0.5 text-[11px] font-medium border uppercase tracking-[0.04em]',
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
      'inline-flex items-center rounded-sm px-2.5 py-0.5 text-[11px] font-medium border capitalize uppercase tracking-[0.04em]',
      priorityColors[priority],
      className
    )}>
      {priority}
    </span>
  )
}
