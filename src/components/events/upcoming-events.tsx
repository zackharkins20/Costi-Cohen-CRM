'use client'

import { useState, useEffect } from 'react'
import { getEventsByEntity } from '@/lib/events'
import type { CalendarEvent, EventType } from '@/lib/types'
import { EVENT_TYPES } from '@/lib/types'
import { Clock, MapPin } from 'lucide-react'
import { format, isPast, parseISO } from 'date-fns'

interface UpcomingEventsProps {
  entityType: 'deal' | 'contact'
  entityId: string
}

function EventTypeBadge({ type }: { type: EventType }) {
  const label = EVENT_TYPES.find(t => t.key === type)?.label ?? type
  const isBold = type === 'deadline' || type === 'meeting'
  return (
    <span
      className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 border rounded ${
        isBold
          ? 'border-cc-text-primary text-cc-text-primary font-semibold'
          : 'border-cc-border text-cc-text-secondary'
      }`}
    >
      {label}
    </span>
  )
}

export function UpcomingEvents({ entityType, entityId }: UpcomingEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    getEventsByEntity(entityType, entityId).then(evts => {
      const upcoming = evts.filter(e => !isPast(parseISO(e.end_time || e.start_time)))
      setEvents(upcoming.slice(0, 5))
    })
  }, [entityType, entityId])

  if (events.length === 0) {
    return <p className="text-xs text-cc-text-muted py-2 text-center">No upcoming events</p>
  }

  return (
    <div className="space-y-2">
      {events.map(event => (
        <div
          key={event.id}
          className="p-2.5 bg-cc-surface-2 border border-cc-border rounded-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-cc-text-primary truncate flex-1">
              {event.title}
            </p>
            <EventTypeBadge type={event.event_type} />
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-cc-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {event.all_day
                ? format(parseISO(event.start_time), 'MMM d')
                : format(parseISO(event.start_time), 'MMM d, h:mm a')}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" />
                {event.location}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
