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

// Task statuses
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export const TASK_STATUSES: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]

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
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  deal?: Deal | null
  assigned_user?: User | null
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
