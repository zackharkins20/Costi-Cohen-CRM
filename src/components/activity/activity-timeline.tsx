'use client'

import { useEffect, useState } from 'react'
import { getActivities, logActivity } from '@/lib/queries'
import { notifyAllUsers } from '@/lib/notifications'
import type { Activity } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { formatLabel } from '@/lib/utils'
import { MessageSquare, Phone, Calendar, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const actionIcons: Record<string, typeof MessageSquare> = {
  note: MessageSquare,
  call: Phone,
  meeting: Calendar,
  email_drafted: Mail,
  stage_change: ArrowRight,
}

const ACTION_TABS = [
  { key: 'note', label: 'Note' },
  { key: 'call', label: 'Call' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'email_drafted', label: 'Email' },
] as const

interface ActivityTimelineProps {
  entityType: 'contact' | 'deal' | 'task'
  entityId: string
  userId?: string
}

export function ActivityTimeline({ entityType, entityId, userId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [noteText, setNoteText] = useState('')
  const [actionType, setActionType] = useState<string>('note')

  useEffect(() => {
    getActivities(entityType, entityId).then(setActivities)
  }, [entityType, entityId])

  const handleAddActivity = async () => {
    if (!noteText.trim()) return
    await logActivity({
      entity_type: entityType,
      entity_id: entityId,
      action: actionType,
      description: noteText,
      created_by: userId,
    })
    await notifyAllUsers({
      title: 'Activity Logged',
      message: `${formatLabel(actionType)} on ${entityType}: ${noteText.slice(0, 80)}`,
      entity_type: entityType,
      entity_id: entityId,
    })
    setNoteText('')
    const updated = await getActivities(entityType, entityId)
    setActivities(updated)
  }

  const logLabel = actionType === 'note' ? 'Log Note'
    : actionType === 'call' ? 'Log Call'
    : actionType === 'meeting' ? 'Log Meeting'
    : 'Log Email'

  return (
    <div>
      {/* Tabbed input */}
      <div className="mb-4">
        <div className="flex border-b border-cc-border mb-3">
          {ACTION_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActionType(tab.key)}
              className={`px-3 py-1.5 text-xs transition-colors border-b-2 -mb-px ${
                actionType === tab.key
                  ? 'border-cc-accent text-cc-text-primary font-medium'
                  : 'border-transparent text-cc-text-muted hover:text-cc-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Jot a quick note..."
          className="text-sm min-h-[50px] rounded-lg resize-none"
        />
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            onClick={handleAddActivity}
            disabled={!noteText.trim()}
            className="h-7 text-xs rounded-lg"
          >
            {logLabel}
          </Button>
        </div>
      </div>

      {/* History */}
      <div>
        {activities.length === 0 ? (
          <p className="text-xs text-cc-text-muted py-2 text-center">No activity yet</p>
        ) : (
          activities.map(activity => {
            const Icon = actionIcons[activity.action] || MessageSquare
            return (
              <div key={activity.id} className="flex gap-3 py-2.5 border-b border-cc-border last:border-0">
                <div className="mt-0.5 flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-cc-surface-2 flex items-center justify-center">
                    <Icon className="h-3 w-3 text-cc-text-muted" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {activity.user?.full_name && (
                      <span className="text-xs font-medium text-cc-text-primary">{activity.user.full_name}</span>
                    )}
                    <span className="text-[10px] text-cc-text-muted">{formatLabel(activity.action)}</span>
                  </div>
                  <p className="text-sm text-cc-text-secondary line-clamp-2">{activity.description}</p>
                  <p className="text-[10px] text-cc-text-muted mt-0.5">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
