'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import type { TaskPriority, User } from '@/lib/types'

export interface TaskFilters {
  search: string
  priorities: TaskPriority[]
  dueDateFilter: 'all' | 'overdue' | 'this_week' | 'this_month'
  assignee: string // user id or 'all'
}

interface Props {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
  users: User[]
}

const PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
]

const DUE_DATE_OPTIONS = [
  { key: 'all' as const, label: 'All Dates' },
  { key: 'overdue' as const, label: 'Overdue' },
  { key: 'this_week' as const, label: 'This Week' },
  { key: 'this_month' as const, label: 'This Month' },
]

export function TaskFilterBar({ filters, onChange, users }: Props) {
  const togglePriority = (p: TaskPriority) => {
    const current = filters.priorities
    const next = current.includes(p)
      ? current.filter(x => x !== p)
      : [...current, p]
    onChange({ ...filters, priorities: next })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap mb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cc-text-muted" />
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="pl-9 w-52 h-9"
        />
      </div>

      {/* Priority toggle chips */}
      <div className="flex gap-1.5">
        {PRIORITIES.map(p => {
          const active = filters.priorities.includes(p.key)
          return (
            <button
              key={p.key}
              onClick={() => togglePriority(p.key)}
              className={`px-3 py-1.5 text-xs border rounded-md transition-colors ${
                active
                  ? 'bg-cc-accent text-white border-cc-accent'
                  : 'bg-transparent text-cc-text-muted border-cc-border hover:border-cc-border-hover hover:text-cc-text-secondary'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Due date filter */}
      <Select
        value={filters.dueDateFilter}
        onValueChange={v => onChange({ ...filters, dueDateFilter: v as TaskFilters['dueDateFilter'] })}
      >
        <SelectTrigger className="w-36 h-9 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DUE_DATE_OPTIONS.map(o => (
            <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assignee dropdown */}
      <Select
        value={filters.assignee}
        onValueChange={v => onChange({ ...filters, assignee: v ?? 'all' })}
      >
        <SelectTrigger className="w-40 h-9 text-xs">
          <SelectValue placeholder="All Assignees" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          {users.map(u => (
            <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
