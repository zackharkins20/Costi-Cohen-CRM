'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { EventModal } from '@/components/events/event-modal'
import { EventPopover } from '@/components/events/event-popover'
import { getEvents, deleteEvent } from '@/lib/events'
import { getDeals, getContacts, getCurrentUser } from '@/lib/queries'
import { EVENT_TYPES, type CalendarEvent, type EventType } from '@/lib/types'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  subMonths,
  subWeeks,
  subDays,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  endOfDay,
  getHours,
  getMinutes,
  differenceInMinutes,
} from 'date-fns'

type ViewMode = 'month' | 'week' | 'day'

function EventTypeBadge({ type }: { type: EventType }) {
  const isBold = type === 'deadline' || type === 'meeting'
  return isBold ? 'border-l-2 border-cc-text-primary' : 'border-l border-cc-border'
}

function EventChip({
  event,
  onClick,
}: {
  event: CalendarEvent
  onClick: (e: React.MouseEvent) => void
}) {
  const borderClass = EventTypeBadge({ type: event.event_type })
  const label = EVENT_TYPES.find(t => t.key === event.event_type)?.label
  return (
    <button
      onClick={onClick}
      className={`text-left w-full px-1.5 py-0.5 text-[10px] leading-tight bg-cc-surface-2 hover:bg-cc-border/50 rounded transition-colors truncate ${borderClass}`}
    >
      {!event.all_day && (
        <span className="text-cc-text-muted mr-1">
          {format(parseISO(event.start_time), 'h:mm')}
        </span>
      )}
      <span className="text-cc-text-primary">{event.title}</span>
    </button>
  )
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [createOpen, setCreateOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [defaultDate, setDefaultDate] = useState<string>('')
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null)
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 })
  const [userId, setUserId] = useState<string>()
  const [deals, setDeals] = useState<{ id: string; title: string }[]>([])
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([])

  const loadEvents = useCallback(() => {
    let start: Date
    let end: Date
    if (viewMode === 'month') {
      start = startOfWeek(startOfMonth(currentDate))
      end = endOfWeek(endOfMonth(currentDate))
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate)
      end = endOfWeek(currentDate)
    } else {
      start = startOfDay(currentDate)
      end = endOfDay(currentDate)
    }
    getEvents(start.toISOString(), end.toISOString()).then(setEvents)
  }, [currentDate, viewMode])

  useEffect(() => { loadEvents() }, [loadEvents])

  useEffect(() => {
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
    getDeals().then(d => setDeals(d.map(dl => ({ id: dl.id, title: dl.title }))))
    getContacts().then(c => setContacts(c.map(ct => ({ id: ct.id, name: ct.name }))))
  }, [])

  const navigate = (dir: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(dir === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(dir === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    } else {
      setCurrentDate(dir === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1))
    }
  }

  const getTitle = () => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy')
    if (viewMode === 'week') {
      const ws = startOfWeek(currentDate)
      const we = endOfWeek(currentDate)
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy')
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setPopoverEvent(event)
    setPopoverPos({ x: e.clientX, y: e.clientY })
  }

  const handleDayClick = (date: Date) => {
    setDefaultDate(format(date, 'yyyy-MM-dd'))
    setEditEvent(null)
    setCreateOpen(true)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setPopoverEvent(null)
    setEditEvent(event)
    setCreateOpen(true)
  }

  const handleDeleteEvent = async (event: CalendarEvent) => {
    await deleteEvent(event.id)
    setPopoverEvent(null)
    loadEvents()
  }

  const handleSaved = () => {
    setCreateOpen(false)
    setEditEvent(null)
    loadEvents()
  }

  const eventsForDay = (date: Date) =>
    events.filter(e => isSameDay(parseISO(e.start_time), date))

  // ── MONTH VIEW ──
  const renderMonth = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    const days: Date[] = []
    let d = calStart
    while (d <= calEnd) {
      days.push(d)
      d = addDays(d, 1)
    }
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="border border-cc-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-cc-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-2 py-2 text-[10px] uppercase tracking-wider text-cc-text-muted text-center font-medium">
              {day}
            </div>
          ))}
        </div>
        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-cc-border last:border-b-0">
            {week.map((day, di) => {
              const dayEvents = eventsForDay(day)
              const inMonth = isSameMonth(day, currentDate)
              const today = isToday(day)
              return (
                <div
                  key={di}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[100px] p-1.5 border-r border-cc-border last:border-r-0 cursor-pointer hover:bg-cc-surface-2/50 transition-colors ${
                    !inMonth ? 'bg-cc-bg/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    <span
                      className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                        today
                          ? 'bg-cc-text-primary text-cc-bg font-semibold'
                          : inMonth
                          ? 'text-cc-text-primary'
                          : 'text-cc-text-muted'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(evt => (
                      <EventChip
                        key={evt.id}
                        event={evt}
                        onClick={e => handleEventClick(evt, e)}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[9px] text-cc-text-muted px-1">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // ── WEEK VIEW ──
  const renderWeek = () => {
    const ws = startOfWeek(currentDate)
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i))
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="border border-cc-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-cc-border">
          <div className="border-r border-cc-border" />
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`px-2 py-2 text-center border-r border-cc-border last:border-r-0 ${
                isToday(day) ? 'bg-cc-surface-2' : ''
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-cc-text-muted">
                {format(day, 'EEE')}
              </p>
              <p
                className={`text-sm font-medium ${
                  isToday(day) ? 'text-cc-text-primary' : 'text-cc-text-secondary'
                }`}
              >
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>
        {/* Time grid */}
        <div className="max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
            {/* Hour labels */}
            {hours.map(h => (
              <div
                key={h}
                className="border-b border-cc-border border-r pr-2 text-right"
                style={{ gridColumn: '1', gridRow: h + 1, height: '48px' }}
              >
                <span className="text-[10px] text-cc-text-muted leading-none -mt-1.5 inline-block">
                  {h === 0 ? '' : format(new Date(2024, 0, 1, h), 'h a')}
                </span>
              </div>
            ))}
            {/* Day columns */}
            {weekDays.map((day, di) => (
              <div
                key={di}
                className="relative border-r border-cc-border last:border-r-0"
                style={{
                  gridColumn: di + 2,
                  gridRow: '1 / -1',
                }}
              >
                {hours.map(h => (
                  <div
                    key={h}
                    className="border-b border-cc-border hover:bg-cc-surface-2/30 cursor-pointer"
                    style={{ height: '48px' }}
                    onClick={() => handleDayClick(day)}
                  />
                ))}
                {/* Event blocks */}
                {eventsForDay(day)
                  .filter(e => !e.all_day)
                  .map(evt => {
                    const start = parseISO(evt.start_time)
                    const end = evt.end_time ? parseISO(evt.end_time) : addDays(start, 0)
                    const startMin = getHours(start) * 60 + getMinutes(start)
                    const duration = Math.max(differenceInMinutes(end, start), 30)
                    const top = (startMin / 60) * 48
                    const height = (duration / 60) * 48
                    const borderClass = EventTypeBadge({ type: evt.event_type })

                    return (
                      <button
                        key={evt.id}
                        onClick={e => handleEventClick(evt, e)}
                        className={`absolute left-0.5 right-0.5 bg-cc-surface-2 rounded px-1.5 py-0.5 text-left overflow-hidden hover:bg-cc-border/50 transition-colors ${borderClass}`}
                        style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
                      >
                        <p className="text-[10px] text-cc-text-primary font-medium truncate">
                          {evt.title}
                        </p>
                        <p className="text-[9px] text-cc-text-muted">
                          {format(start, 'h:mm a')}
                        </p>
                      </button>
                    )
                  })}
                {/* All-day events at top */}
                {eventsForDay(day)
                  .filter(e => e.all_day)
                  .map((evt, idx) => {
                    const borderClass = EventTypeBadge({ type: evt.event_type })
                    return (
                      <button
                        key={evt.id}
                        onClick={e => handleEventClick(evt, e)}
                        className={`absolute left-0.5 right-0.5 bg-cc-surface-2 rounded px-1.5 py-0.5 text-left hover:bg-cc-border/50 transition-colors ${borderClass}`}
                        style={{ top: `${idx * 22}px`, height: '20px' }}
                      >
                        <p className="text-[10px] text-cc-text-primary truncate">{evt.title}</p>
                      </button>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── DAY VIEW ──
  const renderDay = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = eventsForDay(currentDate)

    return (
      <div className="border border-cc-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-cc-border flex items-center gap-3">
          <span
            className={`text-lg font-medium ${
              isToday(currentDate) ? 'text-cc-text-primary' : 'text-cc-text-secondary'
            }`}
          >
            {format(currentDate, 'EEEE, MMMM d')}
          </span>
          {isToday(currentDate) && (
            <span className="text-[10px] uppercase tracking-wider border border-cc-text-primary text-cc-text-primary px-1.5 py-0.5 rounded font-semibold">
              Today
            </span>
          )}
        </div>

        {/* All-day events */}
        {dayEvents.filter(e => e.all_day).length > 0 && (
          <div className="px-4 py-2 border-b border-cc-border bg-cc-surface-2/50">
            <p className="text-[10px] uppercase tracking-wider text-cc-text-muted mb-1">All Day</p>
            <div className="space-y-1">
              {dayEvents.filter(e => e.all_day).map(evt => (
                <EventChip key={evt.id} event={evt} onClick={e => handleEventClick(evt, e)} />
              ))}
            </div>
          </div>
        )}

        {/* Time grid */}
        <div className="max-h-[600px] overflow-y-auto">
          <div className="relative">
            {hours.map(h => (
              <div
                key={h}
                className="flex border-b border-cc-border hover:bg-cc-surface-2/30 cursor-pointer"
                style={{ height: '48px' }}
                onClick={() => handleDayClick(currentDate)}
              >
                <div className="w-16 pr-2 text-right flex-shrink-0 border-r border-cc-border">
                  <span className="text-[10px] text-cc-text-muted leading-none -mt-1.5 inline-block">
                    {h === 0 ? '' : format(new Date(2024, 0, 1, h), 'h a')}
                  </span>
                </div>
                <div className="flex-1 relative" />
              </div>
            ))}
            {/* Positioned events */}
            {dayEvents
              .filter(e => !e.all_day)
              .map(evt => {
                const start = parseISO(evt.start_time)
                const end = evt.end_time ? parseISO(evt.end_time) : start
                const startMin = getHours(start) * 60 + getMinutes(start)
                const duration = Math.max(differenceInMinutes(end, start), 30)
                const top = (startMin / 60) * 48
                const height = (duration / 60) * 48
                const borderClass = EventTypeBadge({ type: evt.event_type })

                return (
                  <button
                    key={evt.id}
                    onClick={e => handleEventClick(evt, e)}
                    className={`absolute bg-cc-surface-2 rounded px-2 py-1 text-left overflow-hidden hover:bg-cc-border/50 transition-colors ${borderClass}`}
                    style={{ top: `${top}px`, height: `${Math.max(height, 24)}px`, left: '68px', right: '8px' }}
                  >
                    <p className="text-xs text-cc-text-primary font-medium truncate">
                      {evt.title}
                    </p>
                    <p className="text-[10px] text-cc-text-muted">
                      {format(start, 'h:mm a')}
                      {evt.end_time && ` – ${format(parseISO(evt.end_time), 'h:mm a')}`}
                    </p>
                    {evt.location && (
                      <p className="text-[10px] text-cc-text-muted truncate">{evt.location}</p>
                    )}
                  </button>
                )
              })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Calendar" description={getTitle()}>
        <div className="flex items-center gap-2">
          {/* View mode tabs */}
          <div className="flex border border-cc-border rounded-md overflow-hidden">
            {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-cc-surface-2 text-cc-text-primary font-medium'
                    : 'text-cc-text-secondary hover:text-cc-text-primary'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button size="icon-sm" variant="ghost" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentDate(new Date())}
              className="text-xs"
            >
              Today
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => { setEditEvent(null); setDefaultDate(format(currentDate, 'yyyy-MM-dd')); setCreateOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> New Event
          </Button>
        </div>
      </PageHeader>

      {events.length === 0 && viewMode === 'month' ? (
        <div>
          {renderMonth()}
        </div>
      ) : viewMode === 'month' ? (
        renderMonth()
      ) : viewMode === 'week' ? (
        renderWeek()
      ) : (
        renderDay()
      )}

      {/* Event popover */}
      {popoverEvent && (
        <EventPopover
          event={popoverEvent}
          position={popoverPos}
          onClose={() => setPopoverEvent(null)}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Event create/edit modal */}
      <EventModal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setEditEvent(null) }}
        onSaved={handleSaved}
        event={editEvent}
        defaultDate={defaultDate}
        userId={userId}
        deals={deals}
        contacts={contacts}
      />
    </div>
  )
}
