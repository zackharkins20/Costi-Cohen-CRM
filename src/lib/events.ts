import { createClient } from './supabase'
import type { CalendarEvent } from './types'

function getClient() { return createClient() }

export async function getEvents(start?: string, end?: string): Promise<CalendarEvent[]> {
  let query = getClient()
    .from('events')
    .select('*')
    .order('start_time', { ascending: true })

  if (start) {
    query = query.gte('start_time', start)
  }
  if (end) {
    query = query.lte('start_time', end)
  }

  const { data } = await query
  return data ?? []
}

export async function getEventsByEntity(entityType: string, entityId: string): Promise<CalendarEvent[]> {
  const { data } = await getClient()
    .from('events')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('start_time', { ascending: true })
  return data ?? []
}

export async function createEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent | null> {
  const { data } = await getClient()
    .from('events')
    .insert(event)
    .select()
    .single()
  return data
}

export async function updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<void> {
  await getClient()
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function deleteEvent(id: string): Promise<void> {
  await getClient().from('events').delete().eq('id', id)
}
