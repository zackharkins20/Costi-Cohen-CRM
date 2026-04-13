import { createClient } from './supabase'
import type { Notification } from './types'

function getClient() { return createClient() }

export async function getAllUserIds(): Promise<string[]> {
  const { data } = await getClient().from('users').select('id')
  return (data ?? []).map(u => u.id)
}

export async function createNotification(input: {
  title: string
  message: string
  user_id: string
  entity_type?: string
  entity_id?: string
}): Promise<void> {
  try {
    await getClient().from('notifications').insert({
      title: input.title,
      message: input.message,
      user_id: input.user_id,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
      read: false,
    })
  } catch (err) {
    console.warn('createNotification failed:', err)
  }
}

export async function notifyAllUsers(input: {
  title: string
  message: string
  entity_type?: string
  entity_id?: string
}): Promise<void> {
  const userIds = await getAllUserIds()
  await Promise.all(
    userIds.map(user_id =>
      createNotification({
        title: input.title,
        message: input.message,
        user_id,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
      })
    )
  )
}
