'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createEvent, updateEvent, deleteEvent } from '@/lib/events'
import { logActivity } from '@/lib/queries'
import { notifyAllUsers } from '@/lib/notifications'
import { EVENT_TYPES, type CalendarEvent, type EventType } from '@/lib/types'
import { Trash2 } from 'lucide-react'

interface EventModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  event?: CalendarEvent | null
  defaultDate?: string
  userId?: string
  deals?: { id: string; title: string }[]
  contacts?: { id: string; name: string }[]
}

export function EventModal({
  open,
  onClose,
  onSaved,
  event,
  defaultDate,
  userId,
  deals = [],
  contacts = [],
}: EventModalProps) {
  const isEdit = !!event
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<EventType>('meeting')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('10:00')
  const [allDay, setAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [entityType, setEntityType] = useState<'deal' | 'contact' | ''>('')
  const [entityId, setEntityId] = useState('')
  const [attendees, setAttendees] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setEventType(event.event_type)
      const start = new Date(event.start_time)
      setStartDate(start.toISOString().split('T')[0])
      setStartTime(start.toTimeString().slice(0, 5))
      if (event.end_time) {
        const end = new Date(event.end_time)
        setEndDate(end.toISOString().split('T')[0])
        setEndTime(end.toTimeString().slice(0, 5))
      }
      setAllDay(event.all_day)
      setLocation(event.location || '')
      setDescription(event.description || '')
      setEntityType(event.entity_type || '')
      setEntityId(event.entity_id || '')
      setAttendees(event.attendees || '')
    } else {
      setTitle('')
      setEventType('meeting')
      setStartDate(defaultDate || new Date().toISOString().split('T')[0])
      setStartTime('09:00')
      setEndDate(defaultDate || new Date().toISOString().split('T')[0])
      setEndTime('10:00')
      setAllDay(false)
      setLocation('')
      setDescription('')
      setEntityType('')
      setEntityId('')
      setAttendees('')
    }
  }, [event, defaultDate, open])

  const handleSave = async () => {
    if (!title.trim()) return

    const startDateTime = allDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime}:00`
    const endDateTime = allDay
      ? `${endDate || startDate}T23:59:59`
      : `${endDate || startDate}T${endTime}:00`

    if (isEdit && event) {
      await updateEvent(event.id, {
        title,
        event_type: eventType,
        start_time: startDateTime,
        end_time: endDateTime,
        all_day: allDay,
        location: location || null,
        description: description || null,
        entity_type: (entityType as 'deal' | 'contact') || null,
        entity_id: entityId || null,
        attendees: attendees || null,
      })
    } else {
      const created = await createEvent({
        title,
        event_type: eventType,
        start_time: startDateTime,
        end_time: endDateTime,
        all_day: allDay,
        location: location || null,
        description: description || null,
        entity_type: (entityType as 'deal' | 'contact') || null,
        entity_id: entityId || null,
        attendees: attendees || null,
        created_by: userId || '',
      })

      if (created && entityType && entityId) {
        await logActivity({
          entity_type: entityType as 'contact' | 'deal',
          entity_id: entityId,
          action: 'meeting',
          description: `Event scheduled: ${title}`,
          created_by: userId,
        })
      }

      if (created) {
        await notifyAllUsers({
          title: 'New Event',
          message: `${title} — ${eventType}`,
          entity_type: entityType || undefined,
          entity_id: entityId || undefined,
        })
      }
    }

    onSaved()
    onClose()
  }

  const handleDelete = async () => {
    if (event) {
      await deleteEvent(event.id)
      setConfirmDelete(false)
      onSaved()
      onClose()
    }
  }

  const entityOptions = entityType === 'deal'
    ? deals.map(d => ({ id: d.id, label: d.title }))
    : entityType === 'contact'
    ? contacts.map(c => ({ id: c.id, label: c.name }))
    : []

  return (
    <>
      <Dialog open={open && !confirmDelete} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Title</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Event title"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Type</Label>
              <Select value={eventType} onValueChange={v => setEventType(v as EventType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="all-day"
                checked={allDay}
                onChange={e => setAllDay(e.target.checked)}
                className="rounded border-cc-border"
              />
              <label htmlFor="all-day" className="text-xs text-cc-text-secondary cursor-pointer">
                All day
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value)
                    if (!endDate || endDate < e.target.value) setEndDate(e.target.value)
                  }}
                  className="mt-1"
                />
              </div>
              {!allDay && (
                <div>
                  <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              {!allDay && (
                <div>
                  <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Location</Label>
              <Input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Location (optional)"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Description</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="mt-1 min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Link to</Label>
                <Select
                  value={entityType || 'none'}
                  onValueChange={v => {
                    setEntityType(v === 'none' ? '' : v as 'deal' | 'contact')
                    setEntityId('')
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="deal">Deal</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {entityType && entityOptions.length > 0 && (
                <div>
                  <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">
                    {entityType === 'deal' ? 'Deal' : 'Contact'}
                  </Label>
                  <Select value={entityId || 'none'} onValueChange={v => setEntityId(!v || v === 'none' ? '' : v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select...</SelectItem>
                      {entityOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Attendees</Label>
              <Input
                value={attendees}
                onChange={e => setAttendees(e.target.value)}
                placeholder="Comma-separated names or emails"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            {isEdit ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="text-cc-destructive hover:text-cc-text-primary"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={!title.trim()}>
                {isEdit ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-cc-text-secondary">
            Are you sure you want to delete &quot;{event?.title}&quot;?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
