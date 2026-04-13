// Pipeline stages
export type PropertyStage = 'lead' | 'initial_call' | 'property_search' | 'due_diligence' | 'exchange' | 'fees_collected'

export const PROPERTY_STAGES: { key: PropertyStage; label: string }[] = [
  { key: 'lead', label: 'Lead' },
  { key: 'initial_call', label: 'Initial Call/Meeting' },
  { key: 'property_search', label: 'Property Search' },
  { key: 'due_diligence', label: 'Due Diligence/Negotiation' },
  { key: 'exchange', label: 'Exchange of Contracts' },
  { key: 'fees_collected', label: 'Fees Collected' },
]

const STAGE_LABEL_TO_KEY: Record<string, PropertyStage> = {}
for (const s of PROPERTY_STAGES) {
  STAGE_LABEL_TO_KEY[s.label.toLowerCase()] = s.key
  STAGE_LABEL_TO_KEY[s.key] = s.key
}

export function normalizeStage(raw: string): PropertyStage {
  if (STAGE_LABEL_TO_KEY[raw]) return STAGE_LABEL_TO_KEY[raw]
  const lower = raw.toLowerCase().trim()
  if (STAGE_LABEL_TO_KEY[lower]) return STAGE_LABEL_TO_KEY[lower]
  // Fuzzy: strip non-alphanumeric and compare
  const stripped = lower.replace(/[^a-z0-9]/g, '')
  for (const s of PROPERTY_STAGES) {
    if (s.key.replace(/[^a-z0-9]/g, '') === stripped) return s.key
    if (s.label.toLowerCase().replace(/[^a-z0-9]/g, '') === stripped) return s.key
  }
  return 'lead'
}

// Task statuses
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export const TASK_STATUSES: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]

const TASK_STATUS_LABEL_TO_KEY: Record<string, TaskStatus> = {}
for (const s of TASK_STATUSES) {
  TASK_STATUS_LABEL_TO_KEY[s.label.toLowerCase()] = s.key
  TASK_STATUS_LABEL_TO_KEY[s.key] = s.key
}

export function normalizeTaskStatus(raw: string): TaskStatus {
  if (TASK_STATUS_LABEL_TO_KEY[raw]) return TASK_STATUS_LABEL_TO_KEY[raw]
  const lower = raw.toLowerCase().trim()
  if (TASK_STATUS_LABEL_TO_KEY[lower]) return TASK_STATUS_LABEL_TO_KEY[lower]
  const stripped = lower.replace(/[^a-z0-9]/g, '')
  for (const s of TASK_STATUSES) {
    if (s.key.replace(/[^a-z0-9]/g, '') === stripped) return s.key
    if (s.label.toLowerCase().replace(/[^a-z0-9]/g, '') === stripped) return s.key
  }
  return 'todo'
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskType = 'deal' | 'general'

// Database types
export interface User {
  id: string
  auth_id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: string
  created_at: string
}

export interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  type: 'client' | 'other'
  stage: PropertyStage
  asset_type: string | null
  budget_min: number | null
  budget_max: number | null
  fee_percentage: number | null
  brief_notes: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  title: string
  stage: PropertyStage
  contact_id: string | null
  deal_value: number | null
  fee_percentage: number | null
  fee_amount: number | null
  description: string | null
  created_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  // Joined
  contact?: Contact | null
  property_details?: DealPropertyDetails | null
}

export interface DealPropertyDetails {
  deal_id: string
  mandate_brief: string | null
  properties_sent: PropertySent[] | null
  purchase_price: number | null
  gst_amount: number | null
  exchange_date: string | null
  settlement_date: string | null
}

export interface PropertySent {
  address: string
  notes: string
  sent_date: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  type: TaskType
  deal_id: string | null
  assigned_to: string | null
  due_date: string | null
  parent_task_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  deal?: Deal | null
  assigned_user?: User | null
}

export interface SubtaskCounts {
  total: number
  done: number
}

export interface Activity {
  id: string
  entity_type: 'contact' | 'deal' | 'task'
  entity_id: string
  action: string
  description: string
  created_by: string
  created_at: string
  // Joined
  user?: User | null
}

export interface DocumentLink {
  id: string
  entity_type: 'contact' | 'deal'
  entity_id: string
  url: string
  title: string
  file_path: string | null
  file_size: number | null
  mime_type: string | null
  link_type: 'url' | 'file'
  created_by: string
  created_at: string
}

export type EventType = 'meeting' | 'call' | 'deadline' | 'follow_up' | 'viewing' | 'other'

export const EVENT_TYPES: { key: EventType; label: string }[] = [
  { key: 'meeting', label: 'Meeting' },
  { key: 'call', label: 'Call' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'follow_up', label: 'Follow-up' },
  { key: 'viewing', label: 'Viewing' },
  { key: 'other', label: 'Other' },
]

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  event_type: EventType
  start_time: string
  end_time: string | null
  all_day: boolean
  location: string | null
  entity_type: 'deal' | 'contact' | null
  entity_id: string | null
  attendees: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Email {
  id: string
  subject: string
  body: string | null
  to_address: string
  from_address: string | null
  cc: string[] | null
  bcc: string[] | null
  status: 'draft' | 'sent' | 'failed'
  sent_at: string | null
  entity_type: 'deal' | 'contact' | null
  entity_id: string | null
  thread_id: string | null
  template_id: string | null
  created_by: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  read: boolean
  entity_type: string | null
  entity_id: string | null
  created_at: string
}
