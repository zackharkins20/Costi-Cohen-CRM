import { createClient } from './supabase'
import { normalizeStage, type Deal, type Contact, type Activity } from './types'

function getClient() { return createClient() }

export async function getDealsInRange(start: string, end: string): Promise<Deal[]> {
  const { data } = await getClient()
    .from('deals')
    .select('*, contact:contacts(*), property_details:deal_property_details(*)')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })
  return (data ?? []).map(d => ({ ...d, stage: normalizeStage(d.stage) }))
}

export async function getContactsInRange(start: string, end: string): Promise<Contact[]> {
  const { data } = await getClient()
    .from('contacts')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })
  return (data ?? []).map(c => ({ ...c, stage: normalizeStage(c.stage) }))
}

export async function getActivitiesInRange(start: string, end: string): Promise<Activity[]> {
  const { data } = await getClient()
    .from('activities')
    .select('*, user:users!activities_created_by_fkey(*)')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })
  return data ?? []
}
