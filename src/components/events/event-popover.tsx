'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { EVENT_TYPES, type CalendarEvent, type EventType } from '@/lib/types'
import { Clock, MapPin, Users, Edit2, Trash2, Link } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface EventPopoverProps {
  event: CalendarEvent
  position: { x: number; y: number }
  onClose: () => void
  onEdit: (event: CalendarEvent) => void
  onDelete: (event: CalendarEvent) => void
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

export function EventPopover({ event, position, onClose, onEdit, onDelete }: EventPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Adjust position to keep popover in viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.min(position.y, window.innerHeight - 280),
    zIndex: 60,
  }

  return (
    <div
      ref={ref}
      style={style}
      className="w-72 bg-cc-surface border border-cc-border rounded-xl shadow-lg p-4"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-medium text-cc-text-primary">{event.title}</h3>
        <EventTypeBadge type={event.event_type} />
      </div>

      <div className="space-y-2 text-xs text-cc-text-secondary">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-cc-text-muted" />
          {event.all_day ? (
            <span>{format(parseISO(event.start_time), 'EEEE, MMMM d')}</span>
          ) : (
            <span>
              {format(parseISO(event.start_time), 'EEE, MMM d · h:mm a')}
              {event.end_time && ` – ${format(parseISO(event.end_time), 'h:mm a')}`}
            </span>
          )}
        </div>

        {event.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-cc-text-muted" />
            <span>{event.location}</span>
          </div>
        )}

        {event.attendees && (
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-cc-text-muted" />
            <span className="truncate">{event.attendees}</span>
          </div>
        )}

        {event.entity_type && (
          <div className="flex items-center gap-2">
            <Link className="h-3.5 w-3.5 text-cc-text-muted" />
            <span className="capitalize">{event.entity_type}</span>
          </div>
        )}

        {event.description && (
          <p className="text-cc-text-muted mt-2 pt-2 border-t border-cc-border">
            {event.description}
          </p>
        )}
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-cc-border">
        <Button
          size="xs"
          variant="outline"
          onClick={() => onEdit(event)}
          className="flex-1"
        >
          <Edit2 className="h-3 w-3 mr-1" /> Edit
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => onDelete(event)}
          className="text-cc-destructive hover:text-cc-text-primary"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
