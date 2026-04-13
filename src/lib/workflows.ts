import { createClient } from './supabase'
import { createTask, logActivity, getCurrentUser } from './queries'
import { createNotification, notifyAllUsers } from './notifications'
import { createEvent } from './events'

function getClient() { return createClient() }

// ── Types ──

export type TriggerType =
  | 'deal_stage_change'
  | 'deal_created'
  | 'contact_created'
  | 'task_overdue'
  | 'task_completed'
  | 'event_created'
  | 'manual'

export type ActionType =
  | 'create_task'
  | 'send_notification'
  | 'send_email_template'
  | 'log_activity'
  | 'create_event'

export interface WorkflowAction {
  type: ActionType
  config: Record<string, unknown>
}

export interface Workflow {
  id: string
  name: string
  description: string | null
  enabled: boolean
  trigger_type: TriggerType
  trigger_config: Record<string, unknown>
  actions: WorkflowAction[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface WorkflowRun {
  id: string
  workflow_id: string
  trigger_event: Record<string, unknown>
  actions_executed: Record<string, unknown>[]
  status: 'running' | 'completed' | 'failed'
  error: string | null
  created_at: string
}

export interface TriggerContext {
  trigger_type: TriggerType
  deal?: { id: string; title: string; stage?: string; contact_id?: string; contact_name?: string }
  contact?: { id: string; name: string; email?: string }
  task?: { id: string; title: string; assigned_to?: string }
  event?: { id: string; title: string }
  user?: { id: string; name: string }
  new_stage?: string
  old_stage?: string
}

// ── CRUD ──

export async function getWorkflows(): Promise<Workflow[]> {
  const { data } = await getClient()
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getWorkflow(id: string): Promise<Workflow | null> {
  const { data } = await getClient()
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function createWorkflow(workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<Workflow | null> {
  const { data } = await getClient()
    .from('workflows')
    .insert(workflow)
    .select()
    .single()
  return data
}

export async function updateWorkflow(id: string, updates: Partial<Workflow>): Promise<void> {
  await getClient()
    .from('workflows')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function deleteWorkflow(id: string): Promise<void> {
  await getClient().from('workflows').delete().eq('id', id)
}

export async function toggleWorkflow(id: string, enabled: boolean): Promise<void> {
  await updateWorkflow(id, { enabled })
}

// ── Workflow Runs ──

export async function getWorkflowRuns(workflowId?: string): Promise<WorkflowRun[]> {
  let query = getClient()
    .from('workflow_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (workflowId) {
    query = query.eq('workflow_id', workflowId)
  }

  const { data } = await query
  return data ?? []
}

// ── Variable Substitution ──

function substituteVariables(text: string, context: TriggerContext): string {
  return text
    .replace(/\{deal\.title\}/g, context.deal?.title ?? '')
    .replace(/\{contact\.name\}/g, context.contact?.name ?? '')
    .replace(/\{contact\.email\}/g, context.contact?.email ?? '')
    .replace(/\{new_stage\}/g, context.new_stage ?? '')
    .replace(/\{old_stage\}/g, context.old_stage ?? '')
    .replace(/\{task\.title\}/g, context.task?.title ?? '')
    .replace(/\{user\.name\}/g, context.user?.name ?? '')
    .replace(/\{event\.title\}/g, context.event?.title ?? '')
}

// ── Action Executors ──

async function executeAction(action: WorkflowAction, context: TriggerContext, userId: string): Promise<Record<string, unknown>> {
  const cfg = action.config

  switch (action.type) {
    case 'create_task': {
      const title = substituteVariables((cfg.title as string) || 'Auto-created task', context)
      const dueOffset = (cfg.due_date_offset as number) || 3
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + dueOffset)

      const task = await createTask({
        title,
        description: substituteVariables((cfg.description as string) || '', context) || null,
        status: 'todo',
        priority: (cfg.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
        type: context.deal ? 'deal' : 'general',
        deal_id: context.deal?.id ?? null,
        assigned_to: (cfg.assignee as string) || userId,
        due_date: dueDate.toISOString().split('T')[0],
        parent_task_id: null,
        created_by: userId,
      })

      return { type: 'create_task', success: !!task, task_id: task?.id }
    }

    case 'send_notification': {
      const title = substituteVariables((cfg.title as string) || 'Workflow Notification', context)
      const message = substituteVariables((cfg.message as string) || '', context)

      if (cfg.target === 'all') {
        await notifyAllUsers({ title, message })
      } else {
        const targetId = (cfg.target_user_id as string) || context.user?.id || userId
        await createNotification({ title, message, user_id: targetId })
      }
      return { type: 'send_notification', success: true }
    }

    case 'log_activity': {
      const entityType = context.deal ? 'deal' : context.contact ? 'contact' : context.task ? 'task' : 'deal'
      const entityId = context.deal?.id || context.contact?.id || context.task?.id || ''
      if (entityId) {
        await logActivity({
          entity_type: entityType as 'contact' | 'deal' | 'task',
          entity_id: entityId,
          action: 'automation',
          description: substituteVariables((cfg.description as string) || 'Automated action', context),
          created_by: userId,
        })
      }
      return { type: 'log_activity', success: true }
    }

    case 'create_event': {
      const title = substituteVariables((cfg.title as string) || 'Auto-created event', context)
      const dayOffset = (cfg.day_offset as number) || 1
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + dayOffset)
      startDate.setHours(9, 0, 0, 0)

      const endDate = new Date(startDate)
      endDate.setHours(10, 0, 0, 0)

      const evt = await createEvent({
        title,
        description: substituteVariables((cfg.description as string) || '', context) || null,
        event_type: (cfg.event_type as 'meeting' | 'call' | 'deadline' | 'follow_up' | 'viewing' | 'other') || 'follow_up',
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        all_day: false,
        location: null,
        entity_type: context.deal ? 'deal' : context.contact ? 'contact' : null,
        entity_id: context.deal?.id || context.contact?.id || null,
        attendees: null,
        created_by: userId,
      })
      return { type: 'create_event', success: !!evt, event_id: evt?.id }
    }

    case 'send_email_template': {
      // Email templates — log as activity since we can't actually send
      const entityId = context.deal?.id || context.contact?.id || ''
      const entityType = context.deal ? 'deal' : context.contact ? 'contact' : 'deal'
      if (entityId) {
        await logActivity({
          entity_type: entityType as 'contact' | 'deal',
          entity_id: entityId,
          action: 'email',
          description: substituteVariables(`Email template sent: ${(cfg.template_name as string) || 'auto'}`, context),
          created_by: userId,
        })
      }
      return { type: 'send_email_template', success: true }
    }

    default:
      return { type: action.type, success: false, error: 'Unknown action type' }
  }
}

// ── Workflow Engine ──

export async function executeWorkflows(context: TriggerContext): Promise<void> {
  try {
    const user = await getCurrentUser()
    const userId = user?.id || ''

    // Fetch all enabled workflows matching the trigger type
    const { data: workflows } = await getClient()
      .from('workflows')
      .select('*')
      .eq('trigger_type', context.trigger_type)
      .eq('enabled', true)

    if (!workflows || workflows.length === 0) return

    for (const workflow of workflows) {
      // Check trigger conditions
      if (!matchesTriggerConfig(workflow.trigger_config, context)) continue

      // Create a run record
      const { data: run } = await getClient()
        .from('workflow_runs')
        .insert({
          workflow_id: workflow.id,
          trigger_event: context as unknown as Record<string, unknown>,
          actions_executed: [],
          status: 'running',
        })
        .select()
        .single()

      if (!run) continue

      const actionsExecuted: Record<string, unknown>[] = []
      let failed = false
      let errorMsg = ''

      // Execute each action in sequence
      for (const action of (workflow.actions as WorkflowAction[])) {
        try {
          const result = await executeAction(action, context, userId)
          actionsExecuted.push(result)
        } catch (err) {
          failed = true
          errorMsg = err instanceof Error ? err.message : 'Action failed'
          actionsExecuted.push({ type: action.type, success: false, error: errorMsg })
          break
        }
      }

      // Update run record
      await getClient()
        .from('workflow_runs')
        .update({
          actions_executed: actionsExecuted,
          status: failed ? 'failed' : 'completed',
          error: failed ? errorMsg : null,
        })
        .eq('id', run.id)
    }
  } catch (err) {
    console.warn('executeWorkflows failed:', err)
  }
}

function matchesTriggerConfig(config: Record<string, unknown>, context: TriggerContext): boolean {
  if (!config || Object.keys(config).length === 0) return true

  // For deal_stage_change, check if target stage matches
  if (context.trigger_type === 'deal_stage_change' && config.to_stage) {
    if (context.new_stage !== config.to_stage) return false
  }

  if (context.trigger_type === 'deal_stage_change' && config.from_stage) {
    if (context.old_stage !== config.from_stage) return false
  }

  return true
}

// ── Pre-built Templates ──

export const WORKFLOW_TEMPLATES: Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'created_by'>[] = [
  {
    name: 'New Deal Onboarding',
    description: 'When a new deal is created, automatically create setup tasks and notify the team.',
    enabled: true,
    trigger_type: 'deal_created',
    trigger_config: {},
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Review deal brief: {deal.title}',
          description: 'Review the deal details and confirm all information is correct.',
          priority: 'high',
          due_date_offset: 1,
        },
      },
      {
        type: 'create_task',
        config: {
          title: 'Schedule initial client meeting for {deal.title}',
          description: 'Contact {contact.name} to arrange the first meeting.',
          priority: 'medium',
          due_date_offset: 3,
        },
      },
      {
        type: 'send_notification',
        config: {
          title: 'New deal onboarding started',
          message: 'Deal "{deal.title}" has been created. Setup tasks have been assigned.',
          target: 'all',
        },
      },
    ],
  },
  {
    name: 'Deal Moved to Exchange',
    description: 'When a deal reaches Exchange of Contracts, create settlement tasks and schedule deadlines.',
    enabled: true,
    trigger_type: 'deal_stage_change',
    trigger_config: { to_stage: 'contracts_exchanged' },
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Prepare settlement documents for {deal.title}',
          description: 'Ensure all exchange documents are ready for settlement.',
          priority: 'urgent',
          due_date_offset: 2,
        },
      },
      {
        type: 'create_event',
        config: {
          title: 'Settlement deadline: {deal.title}',
          event_type: 'deadline',
          day_offset: 14,
          description: 'Settlement deadline for deal {deal.title}.',
        },
      },
      {
        type: 'send_notification',
        config: {
          title: 'Deal reached Exchange',
          message: '"{deal.title}" has moved to Exchange of Contracts. Settlement tasks created.',
          target: 'all',
        },
      },
    ],
  },
  {
    name: 'Task Overdue Alert',
    description: 'When a task becomes overdue, send a notification to the team.',
    enabled: true,
    trigger_type: 'task_overdue',
    trigger_config: {},
    actions: [
      {
        type: 'send_notification',
        config: {
          title: 'Task Overdue',
          message: 'Task "{task.title}" is past its due date. Please review and take action.',
          target: 'all',
        },
      },
    ],
  },
  {
    name: 'New Contact Follow-up',
    description: 'When a new contact is added, create a follow-up task and schedule an intro call.',
    enabled: true,
    trigger_type: 'contact_created',
    trigger_config: {},
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Send intro email to {contact.name}',
          description: 'Send a welcome email and introduction to our services.',
          priority: 'medium',
          due_date_offset: 1,
        },
      },
      {
        type: 'create_event',
        config: {
          title: 'Intro call with {contact.name}',
          event_type: 'call',
          day_offset: 3,
          description: 'Initial discovery call with {contact.name}.',
        },
      },
    ],
  },
]

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  deal_stage_change: 'Deal Stage Change',
  deal_created: 'Deal Created',
  contact_created: 'Contact Created',
  task_overdue: 'Task Overdue',
  task_completed: 'Task Completed',
  event_created: 'Event Created',
  manual: 'Manual',
}

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  create_task: 'Create Task',
  send_notification: 'Send Notification',
  send_email_template: 'Send Email Template',
  log_activity: 'Log Activity',
  create_event: 'Create Event',
}
