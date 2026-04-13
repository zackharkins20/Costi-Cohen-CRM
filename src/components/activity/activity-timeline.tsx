'use client'

import { useEffect, useState } from 'react'
import { getActivities, logActivity } from '@/lib/queries'
import { notifyAllUsers } from '@/lib/notifications'
import type { Activity } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Phone, Calendar, Mail, ArrowRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const actionIcons: Record<string, typeof MessageSquare> = {
  note: MessageSquare,
  call: Phone,
  meeting: Calendar,
  email_drafted: Mail,
  stage_change: ArrowRight,
}

interface ActivityTimelineProps {
  entityType: 'contact' | 'deal' | 'task'
  entityId: string
  userId?: string
}

export function ActivityTimeline({ entityType, entityId, userId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [showForm, setShowForm] = useState(false)
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
      message: `${actionType.replace('_', ' ')} on ${entityType}: ${noteText.slice(0, 80)}`,
      entity_type: entityType,
      entity_id: entityId,
    })
    setNoteText('')
    setShowForm(false)
    const updated = await getActivities(entityType, entityId)
    setActivities(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-cc-text-primary">Activity</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-cc-text-primary hover:text-cc-text-primary h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {showForm && (
        <div className="space-y-2 p-4 bg-cc-surface-2 border border-cc-border">
          <div className="flex gap-1">
            {(['note', 'call', 'meeting', 'email_drafted'] as const).map(type => (
              <button
                key={type}
                onClick={() => setActionType(type)}
                className={`px-2 py-1 text-xs capitalize ${
                  actionType === type
                    ? 'bg-transparent text-cc-text-primary border border-cc-btn-border'
                    : 'text-cc-text-muted hover:text-cc-text-secondary'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
          <Textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add a note..."
            className="text-sm min-h-[60px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-xs h-7">
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddActivity} className="text-xs h-7">
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-0">
        {activities.length === 0 ? (
          <p className="text-xs text-cc-text-muted py-4 text-center">No activity yet</p>
        ) : (
          activities.map(activity => {
            const Icon = actionIcons[activity.action] || MessageSquare
            return (
              <div key={activity.id} className="flex gap-3 py-3 border-b border-cc-border last:border-0">
                <div className="mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-cc-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
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
