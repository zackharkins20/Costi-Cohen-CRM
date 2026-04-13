import { createClient } from './supabase'
import type { Email } from './types'

function getClient() { return createClient() }

export async function getEmails(entityType?: string, entityId?: string): Promise<Email[]> {
  let query = getClient()
    .from('emails')
    .select('*')
    .order('created_at', { ascending: false })

  if (entityType) query = query.eq('entity_type', entityType)
  if (entityId) query = query.eq('entity_id', entityId)

  const { data } = await query
  return data ?? []
}

export async function getEmailById(id: string): Promise<Email | null> {
  const { data } = await getClient()
    .from('emails')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function createEmail(input: Omit<Email, 'id' | 'created_at'>): Promise<Email | null> {
  const { data } = await getClient()
    .from('emails')
    .insert(input)
    .select()
    .single()
  return data
}

export async function updateEmail(id: string, updates: Partial<Email>): Promise<void> {
  await getClient()
    .from('emails')
    .update(updates)
    .eq('id', id)
}

export async function deleteEmail(id: string): Promise<void> {
  await getClient().from('emails').delete().eq('id', id)
}

export async function getEmailsByThread(threadId: string): Promise<Email[]> {
  const { data } = await getClient()
    .from('emails')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function getRecentEmails(limit = 20): Promise<Email[]> {
  const { data } = await getClient()
    .from('emails')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
