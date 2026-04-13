import { createClient } from './supabase'
import type { Contact, Deal, Task, Activity, DocumentLink, Notification, User, DealPropertyDetails } from './types'

function getClient() { return createClient() }

// ── Users ──
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single()
  return data
}

export async function getUsers(): Promise<User[]> {
  const { data } = await getClient().from('users').select('*').order('full_name')
  return data ?? []
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  await getClient().from('users').update(updates).eq('id', id)
}

// ── Contacts ──
export async function getContacts(): Promise<Contact[]> {
  const { data } = await getClient()
    .from('contacts')
    .select('*')
    .order('updated_at', { ascending: false })
  return data ?? []
}

export async function getContact(id: string): Promise<Contact | null> {
  const { data } = await getClient()
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact | null> {
  const { data } = await getClient()
    .from('contacts')
    .insert(contact)
    .select()
    .single()
  return data
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<void> {
  await getClient()
    .from('contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function deleteContact(id: string): Promise<void> {
  await getClient().from('contacts').delete().eq('id', id)
}

// ── Deals ──
export async function getDeals(): Promise<Deal[]> {
  const { data } = await getClient()
    .from('deals')
    .select('*, contact:contacts(*), property_details:deal_property_details(*)')
    .order('updated_at', { ascending: false })
  return data ?? []
}

export async function getDeal(id: string): Promise<Deal | null> {
  const { data } = await getClient()
    .from('deals')
    .select('*, contact:contacts(*), property_details:deal_property_details(*)')
    .eq('id', id)
    .single()
  return data
}

export async function createDeal(deal: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'contact' | 'property_details'>): Promise<Deal | null> {
  const { data } = await getClient()
    .from('deals')
    .insert(deal)
    .select()
    .single()
  if (data) {
    await getClient()
      .from('deal_property_details')
      .insert({ deal_id: data.id, properties_sent: [] })
  }
  return data
}

export async function updateDeal(id: string, updates: Partial<Deal>): Promise<void> {
  const { contact, property_details, ...rest } = updates as Deal
  await getClient()
    .from('deals')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function updateDealPropertyDetails(dealId: string, updates: Partial<DealPropertyDetails>): Promise<void> {
  await getClient()
    .from('deal_property_details')
    .update(updates)
    .eq('deal_id', dealId)
}

export async function deleteDeal(id: string): Promise<void> {
  await getClient().from('deal_property_details').delete().eq('deal_id', id)
  await getClient().from('deals').delete().eq('id', id)
}

// ── Tasks ──
export async function getTasks(): Promise<Task[]> {
  const { data } = await getClient()
    .from('tasks')
    .select('*, deal:deals(id, title), assigned_user:users!tasks_assigned_to_fkey(*)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'deal' | 'assigned_user'>): Promise<Task | null> {
  const { data } = await getClient()
    .from('tasks')
    .insert(task)
    .select()
    .single()
  return data
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const { deal, assigned_user, ...rest } = updates as Task
  await getClient()
    .from('tasks')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function deleteTask(id: string): Promise<void> {
  await getClient().from('tasks').delete().eq('id', id)
}

// ── Activities ──
export async function getActivities(entityType: string, entityId: string): Promise<Activity[]> {
  const { data } = await getClient()
    .from('activities')
    .select('*, user:users!activities_created_by_fkey(*)')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getRecentActivities(limit = 10): Promise<Activity[]> {
  const { data } = await getClient()
    .from('activities')
    .select('*, user:users!activities_created_by_fkey(*)')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function logActivity(input: {
  entity_type: 'contact' | 'deal' | 'task'
  entity_id: string
  action: string
  description: string
  created_by?: string
}): Promise<void> {
  try {
    await getClient().from('activities').insert(input)
  } catch (err) {
    console.warn('logActivity failed:', err)
  }
}

// ── Document Links ──
export async function getDocumentLinks(entityType: string, entityId: string): Promise<DocumentLink[]> {
  const { data } = await getClient()
    .from('document_links')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createDocumentLink(link: Omit<DocumentLink, 'id' | 'created_at'>): Promise<void> {
  await getClient().from('document_links').insert(link)
}

export async function deleteDocumentLink(id: string): Promise<void> {
  await getClient().from('document_links').delete().eq('id', id)
}

// ── Notifications ──
export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data } = await getClient()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

export async function markNotificationRead(id: string): Promise<void> {
  await getClient().from('notifications').update({ read: true }).eq('id', id)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await getClient()
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
}
