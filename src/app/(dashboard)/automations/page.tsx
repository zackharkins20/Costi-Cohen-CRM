'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  getWorkflows,
  getWorkflowRuns,
  createWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  WORKFLOW_TEMPLATES,
  TRIGGER_TYPE_LABELS,
  ACTION_TYPE_LABELS,
  type Workflow,
  type WorkflowRun,
  type WorkflowAction,
  type TriggerType,
  type ActionType,
} from '@/lib/workflows'
import { getCurrentUser } from '@/lib/queries'
import { PROPERTY_STAGES } from '@/lib/types'
import { formatLabel } from '@/lib/utils'
import {
  Zap, Plus, Trash2, Power, PowerOff,
  ChevronDown, ChevronRight, Clock,
  CheckCircle, XCircle, Loader2, Copy,
  ArrowRight, Play, History,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

// ── Workflow Editor (3-step) ──

interface EditorProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  userId: string
  initial?: Partial<Workflow>
}

function WorkflowEditor({ open, onClose, onSaved, userId, initial }: EditorProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [triggerType, setTriggerType] = useState<TriggerType>(initial?.trigger_type || 'deal_created')
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(initial?.trigger_config || {})
  const [actions, setActions] = useState<WorkflowAction[]>((initial?.actions as WorkflowAction[]) || [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setStep(1)
      setName(initial?.name || '')
      setDescription(initial?.description || '')
      setTriggerType(initial?.trigger_type || 'deal_created')
      setTriggerConfig(initial?.trigger_config || {})
      setActions((initial?.actions as WorkflowAction[]) || [])
    }
  }, [open, initial])

  const addAction = () => {
    setActions([...actions, { type: 'create_task', config: { title: '', priority: 'medium', due_date_offset: 3 } }])
  }

  const updateAction = (index: number, updates: Partial<WorkflowAction>) => {
    setActions(actions.map((a, i) => i === index ? { ...a, ...updates } : a))
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const updateActionConfig = (index: number, key: string, value: unknown) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], config: { ...updated[index].config, [key]: value } }
    setActions(updated)
  }

  const handleSave = async () => {
    if (!name.trim() || actions.length === 0) return
    setSaving(true)
    await createWorkflow({
      name,
      description: description || null,
      enabled: true,
      trigger_type: triggerType,
      trigger_config: triggerConfig,
      actions,
      created_by: userId,
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {initial ? 'Create from Template' : 'New Workflow'}
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => s < step && setStep(s)}
                  className={`w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                    s === step
                      ? 'bg-cc-text-primary text-cc-bg'
                      : s < step
                        ? 'bg-cc-surface-3 text-cc-text-primary'
                        : 'bg-cc-surface-2 text-cc-text-muted'
                  }`}
                >
                  {s}
                </button>
                {s < 3 && (
                  <div className={`w-8 h-px ${s < step ? 'bg-cc-text-secondary' : 'bg-cc-border'}`} />
                )}
              </div>
            ))}
            <span className="text-xs text-cc-text-muted ml-2">
              {step === 1 ? 'Trigger' : step === 2 ? 'Actions' : 'Review & Save'}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          {/* Step 1: Trigger */}
          {step === 1 && (
            <>
              <div>
                <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Workflow Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" placeholder="e.g. New Deal Onboarding" />
              </div>
              <div>
                <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1.5 min-h-[50px]" placeholder="What does this workflow do?" />
              </div>
              <div>
                <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Trigger Type *</Label>
                <Select value={triggerType} onValueChange={v => { setTriggerType(v as TriggerType); setTriggerConfig({}) }}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TRIGGER_TYPE_LABELS) as TriggerType[]).map(t => (
                      <SelectItem key={t} value={t}>{TRIGGER_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {triggerType === 'deal_stage_change' && (
                <div>
                  <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Target Stage (optional)</Label>
                  <Select value={(triggerConfig.to_stage as string) || 'any'} onValueChange={v => setTriggerConfig(v === 'any' ? {} : { to_stage: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any stage</SelectItem>
                      {PROPERTY_STAGES.map(s => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Step 2: Actions */}
          {step === 2 && (
            <>
              {actions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-cc-text-muted mb-3">No actions yet. Add at least one action.</p>
                </div>
              ) : (
                actions.map((action, i) => (
                  <GlassCard key={i} hover={false} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-cc-text-secondary">Action {i + 1}</span>
                      <button onClick={() => removeAction(i)} className="text-cc-text-muted hover:text-cc-text-primary transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Action Type</Label>
                        <Select value={action.type} onValueChange={v => updateAction(i, { type: v as ActionType, config: {} })}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ACTION_TYPE_LABELS) as ActionType[]).map(a => (
                              <SelectItem key={a} value={a}>{ACTION_TYPE_LABELS[a]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {action.type === 'create_task' && (
                        <>
                          <div>
                            <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Task Title</Label>
                            <Input
                              value={(action.config.title as string) || ''}
                              onChange={e => updateActionConfig(i, 'title', e.target.value)}
                              className="mt-1"
                              placeholder="e.g. Review {deal.title}"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Priority</Label>
                              <Select value={(action.config.priority as string) || 'medium'} onValueChange={v => updateActionConfig(i, 'priority', v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Due in (days)</Label>
                              <Input
                                type="number"
                                value={(action.config.due_date_offset as number) || 3}
                                onChange={e => updateActionConfig(i, 'due_date_offset', Number(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {action.type === 'send_notification' && (
                        <>
                          <div>
                            <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Notification Title</Label>
                            <Input
                              value={(action.config.title as string) || ''}
                              onChange={e => updateActionConfig(i, 'title', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Message</Label>
                            <Textarea
                              value={(action.config.message as string) || ''}
                              onChange={e => updateActionConfig(i, 'message', e.target.value)}
                              className="mt-1 min-h-[40px]"
                            />
                          </div>
                          <div>
                            <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Target</Label>
                            <Select value={(action.config.target as string) || 'all'} onValueChange={v => updateActionConfig(i, 'target', v)}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="trigger_user">Trigger User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      {action.type === 'create_event' && (
                        <>
                          <div>
                            <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Event Title</Label>
                            <Input
                              value={(action.config.title as string) || ''}
                              onChange={e => updateActionConfig(i, 'title', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Event Type</Label>
                              <Select value={(action.config.event_type as string) || 'follow_up'} onValueChange={v => updateActionConfig(i, 'event_type', v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="meeting">Meeting</SelectItem>
                                  <SelectItem value="call">Call</SelectItem>
                                  <SelectItem value="deadline">Deadline</SelectItem>
                                  <SelectItem value="follow_up">Follow-up</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Days from now</Label>
                              <Input
                                type="number"
                                value={(action.config.day_offset as number) || 1}
                                onChange={e => updateActionConfig(i, 'day_offset', Number(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {action.type === 'log_activity' && (
                        <div>
                          <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Activity Description</Label>
                          <Input
                            value={(action.config.description as string) || ''}
                            onChange={e => updateActionConfig(i, 'description', e.target.value)}
                            className="mt-1"
                            placeholder="e.g. Automation ran for {deal.title}"
                          />
                        </div>
                      )}

                      {action.type === 'send_email_template' && (
                        <div>
                          <Label className="text-cc-text-muted text-[10px] uppercase tracking-wider">Template Name</Label>
                          <Input
                            value={(action.config.template_name as string) || ''}
                            onChange={e => updateActionConfig(i, 'template_name', e.target.value)}
                            className="mt-1"
                            placeholder="e.g. Welcome email"
                          />
                        </div>
                      )}
                    </div>
                  </GlassCard>
                ))
              )}
              <Button variant="outline" onClick={addAction} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Add Action
              </Button>
              <p className="text-[10px] text-cc-text-muted">
                Variables: {'{deal.title}'}, {'{contact.name}'}, {'{contact.email}'}, {'{new_stage}'}, {'{task.title}'}, {'{user.name}'}
              </p>
            </>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <GlassCard hover={false} className="p-4">
                <h4 className="text-xs font-medium text-cc-text-muted uppercase tracking-wider mb-2">Workflow</h4>
                <p className="text-sm font-medium text-cc-text-primary">{name}</p>
                {description && <p className="text-xs text-cc-text-secondary mt-1">{description}</p>}
              </GlassCard>

              <GlassCard hover={false} className="p-4">
                <h4 className="text-xs font-medium text-cc-text-muted uppercase tracking-wider mb-2">Trigger</h4>
                <p className="text-sm text-cc-text-primary">{TRIGGER_TYPE_LABELS[triggerType]}</p>
                {triggerConfig.to_stage ? (
                  <p className="text-xs text-cc-text-secondary mt-1">
                    Target: {PROPERTY_STAGES.find(s => s.key === triggerConfig.to_stage)?.label}
                  </p>
                ) : null}
              </GlassCard>

              <GlassCard hover={false} className="p-4">
                <h4 className="text-xs font-medium text-cc-text-muted uppercase tracking-wider mb-2">
                  Actions ({actions.length})
                </h4>
                <div className="space-y-2">
                  {actions.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded bg-cc-surface-2 flex items-center justify-center text-[10px] text-cc-text-muted">{i + 1}</span>
                      <span className="text-cc-text-primary">{ACTION_TYPE_LABELS[a.type]}</span>
                      {a.config.title ? (
                        <span className="text-cc-text-muted text-xs truncate">— {a.config.title as string}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-cc-border">
          <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !name.trim() : actions.length === 0}
            >
              Next <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Saving...</> : 'Save Workflow'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Run History Row (per-workflow inline) ──

function RunRow({ run }: { run: WorkflowRun }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border-b border-cc-border last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-2.5 px-3 hover:bg-cc-surface-2/50 transition-colors text-left"
      >
        {run.status === 'completed' ? (
          <CheckCircle className="h-3.5 w-3.5 text-cc-text-secondary flex-shrink-0" />
        ) : run.status === 'failed' ? (
          <XCircle className="h-3.5 w-3.5 text-cc-text-muted flex-shrink-0" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 text-cc-text-muted animate-spin flex-shrink-0" />
        )}
        <span className="text-xs text-cc-text-secondary flex-1">
          {run.status === 'completed' ? 'Completed' : run.status === 'failed' ? 'Failed' : 'Running'}
        </span>
        <span className="text-[10px] text-cc-text-muted">
          {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
        </span>
        {expanded ? <ChevronDown className="h-3 w-3 text-cc-text-muted" /> : <ChevronRight className="h-3 w-3 text-cc-text-muted" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pl-9 space-y-1">
          {run.error && (
            <p className="text-xs text-cc-text-muted">Error: {run.error}</p>
          )}
          {(run.actions_executed as Record<string, unknown>[])?.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              {a.success ? (
                <CheckCircle className="h-3 w-3 text-cc-text-secondary" />
              ) : (
                <XCircle className="h-3 w-3 text-cc-text-muted" />
              )}
              <span className="text-cc-text-secondary">{ACTION_TYPE_LABELS[(a.type as ActionType)] || a.type as string}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Global Run History Row (expandable table row) ──

function GlobalRunRow({ run, workflowName }: { run: WorkflowRun; workflowName: string }) {
  const [expanded, setExpanded] = useState(false)

  const triggerEvent = run.trigger_event as Record<string, unknown>
  const triggerLabel = triggerEvent?.trigger_type
    ? formatLabel(triggerEvent.trigger_type as string)
    : '—'

  const statusConfig = {
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    running: { label: 'Running', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  }

  const status = statusConfig[run.status] || statusConfig.running

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell className="text-cc-text-primary font-medium">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-3 w-3 text-cc-text-muted flex-shrink-0" /> : <ChevronRight className="h-3 w-3 text-cc-text-muted flex-shrink-0" />}
            {workflowName}
          </div>
        </TableCell>
        <TableCell className="text-xs">{triggerLabel}</TableCell>
        <TableCell>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${status.className}`}>
            {status.label}
          </span>
        </TableCell>
        <TableCell className="text-xs text-cc-text-muted">
          {format(new Date(run.created_at), 'dd MMM yyyy HH:mm')}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={4} className="bg-cc-surface-2/30">
            <div className="py-2 pl-6 space-y-1.5">
              {run.error && (
                <p className="text-xs text-red-600 dark:text-red-400">Error: {run.error}</p>
              )}
              {(run.actions_executed as Record<string, unknown>[])?.length > 0 ? (
                (run.actions_executed as Record<string, unknown>[]).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    {a.success ? (
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
                    )}
                    <span className="text-cc-text-secondary">
                      {ACTION_TYPE_LABELS[(a.type as ActionType)] || (a.type as string)}
                    </span>
                    {a.error ? <span className="text-cc-text-muted text-[10px]">— {String(a.error)}</span> : null}
                  </div>
                ))
              ) : (
                <p className="text-xs text-cc-text-muted">No action details available</p>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// ── Main Page ──

type PageTab = 'workflows' | 'run_history'

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [runs, setRuns] = useState<Record<string, WorkflowRun[]>>({})
  const [expandedRuns, setExpandedRuns] = useState<Record<string, boolean>>({})
  const [userId, setUserId] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorInitial, setEditorInitial] = useState<Partial<Workflow> | undefined>()
  const [activeTab, setActiveTab] = useState<PageTab>('workflows')
  const [globalRuns, setGlobalRuns] = useState<WorkflowRun[]>([])
  const [globalRunsLimit, setGlobalRunsLimit] = useState(50)
  const [loadingRuns, setLoadingRuns] = useState(false)

  const load = async () => {
    const [wfs, user] = await Promise.all([getWorkflows(), getCurrentUser()])
    setWorkflows(wfs)
    if (user) setUserId(user.id)
  }

  const loadGlobalRuns = async () => {
    setLoadingRuns(true)
    const data = await getWorkflowRuns()
    setGlobalRuns(data)
    setLoadingRuns(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (activeTab === 'run_history' && globalRuns.length === 0) {
      loadGlobalRuns()
    }
  }, [activeTab])

  const handleToggle = async (id: string, enabled: boolean) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, enabled } : w))
    await toggleWorkflow(id, enabled)
  }

  const handleDelete = async (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id))
    await deleteWorkflow(id)
  }

  const handleToggleRuns = async (workflowId: string) => {
    const isExpanded = expandedRuns[workflowId]
    setExpandedRuns(prev => ({ ...prev, [workflowId]: !isExpanded }))
    if (!isExpanded && !runs[workflowId]) {
      const data = await getWorkflowRuns(workflowId)
      setRuns(prev => ({ ...prev, [workflowId]: data }))
    }
  }

  const handleCreateFromTemplate = (template: typeof WORKFLOW_TEMPLATES[number]) => {
    setEditorInitial({
      name: template.name,
      description: template.description,
      trigger_type: template.trigger_type,
      trigger_config: template.trigger_config,
      actions: template.actions,
    })
    setEditorOpen(true)
  }

  const handleNewWorkflow = () => {
    setEditorInitial(undefined)
    setEditorOpen(true)
  }

  // Map workflow IDs to names for run history
  const workflowNameMap: Record<string, string> = {}
  for (const w of workflows) {
    workflowNameMap[w.id] = w.name
  }

  return (
    <div>
      <PageHeader title="Automations" description="Automate tasks and notifications with workflow rules">
        <Button onClick={handleNewWorkflow}>
          <Plus className="h-4 w-4 mr-1" /> New Workflow
        </Button>
      </PageHeader>

      {/* Tab switcher */}
      <div className="flex gap-1.5 mb-8">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-3 py-1.5 text-xs border rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'workflows'
              ? 'bg-cc-accent text-white border-cc-accent'
              : 'bg-transparent text-cc-text-secondary border-cc-border hover:border-cc-btn-border hover:text-cc-text-primary'
          }`}
        >
          <Zap className="h-3.5 w-3.5" /> Workflows
        </button>
        <button
          onClick={() => setActiveTab('run_history')}
          className={`px-3 py-1.5 text-xs border rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'run_history'
              ? 'bg-cc-accent text-white border-cc-accent'
              : 'bg-transparent text-cc-text-secondary border-cc-border hover:border-cc-btn-border hover:text-cc-text-primary'
          }`}
        >
          <History className="h-3.5 w-3.5" /> Run History
        </button>
      </div>

      {activeTab === 'workflows' ? (
        <>
          {/* Templates section */}
          <div className="mb-8">
            <h3 className="text-[13px] font-semibold text-cc-text-primary mb-4 uppercase tracking-[0.04em]">
              Templates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WORKFLOW_TEMPLATES.map((template, i) => (
                <GlassCard key={i} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-3.5 w-3.5 text-cc-text-secondary flex-shrink-0" />
                        <h4 className="text-sm font-medium text-cc-text-primary truncate">{template.name}</h4>
                      </div>
                      <p className="text-xs text-cc-text-secondary line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cc-surface-3 text-cc-text-secondary">
                          {TRIGGER_TYPE_LABELS[template.trigger_type]}
                        </span>
                        <span className="text-[10px] text-cc-text-muted">
                          {template.actions.length} action{template.actions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateFromTemplate(template)}
                      className="ml-3 flex-shrink-0"
                    >
                      <Copy className="h-3 w-3 mr-1" /> Use
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Active Workflows */}
          <div>
            <h3 className="text-[13px] font-semibold text-cc-text-primary mb-4 uppercase tracking-[0.04em]">
              Active Workflows
            </h3>

            {workflows.length === 0 ? (
              <GlassCard hover={false} className="p-8 text-center">
                <Zap className="h-8 w-8 text-cc-text-muted mx-auto mb-3" />
                <p className="text-sm text-cc-text-secondary">No workflows yet</p>
                <p className="text-xs text-cc-text-muted mt-1">Create one from a template or build your own</p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {workflows.map(workflow => (
                  <GlassCard key={workflow.id} hover={false} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className={`h-3.5 w-3.5 flex-shrink-0 ${workflow.enabled ? 'text-cc-text-primary' : 'text-cc-text-muted'}`} />
                            <h4 className={`text-sm font-medium truncate ${workflow.enabled ? 'text-cc-text-primary' : 'text-cc-text-muted'}`}>
                              {workflow.name}
                            </h4>
                          </div>
                          {workflow.description && (
                            <p className="text-xs text-cc-text-secondary ml-5.5">{workflow.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 ml-5.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cc-surface-3 text-cc-text-secondary">
                              {TRIGGER_TYPE_LABELS[workflow.trigger_type as TriggerType]}
                            </span>
                            <ArrowRight className="h-3 w-3 text-cc-text-muted" />
                            <span className="text-[10px] text-cc-text-muted">
                              {(workflow.actions as WorkflowAction[]).length} action{(workflow.actions as WorkflowAction[]).length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-3">
                          <button
                            onClick={() => handleToggle(workflow.id, !workflow.enabled)}
                            title={workflow.enabled ? 'Disable' : 'Enable'}
                            className={`p-1.5 rounded-md transition-colors ${
                              workflow.enabled
                                ? 'text-cc-text-primary hover:bg-cc-surface-2'
                                : 'text-cc-text-muted hover:bg-cc-surface-2'
                            }`}
                          >
                            {workflow.enabled ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(workflow.id)}
                            className="p-1.5 rounded-md text-cc-text-muted hover:text-cc-text-primary hover:bg-cc-surface-2 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Run history toggle */}
                      <button
                        onClick={() => handleToggleRuns(workflow.id)}
                        className="flex items-center gap-1 mt-3 ml-5 text-[11px] text-cc-text-muted hover:text-cc-text-secondary transition-colors"
                      >
                        <Clock className="h-3 w-3" />
                        Run history
                        {expandedRuns[workflow.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </button>
                    </div>

                    {/* Expanded run history */}
                    {expandedRuns[workflow.id] && (
                      <div className="border-t border-cc-border bg-cc-surface/50">
                        {!runs[workflow.id] || runs[workflow.id].length === 0 ? (
                          <p className="text-xs text-cc-text-muted text-center py-4">No runs yet</p>
                        ) : (
                          runs[workflow.id].map(run => (
                            <RunRow key={run.id} run={run} />
                          ))
                        )}
                      </div>
                    )}
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Run History tab */
        <div>
          <h3 className="text-[13px] font-semibold text-cc-text-primary mb-4 uppercase tracking-[0.04em]">
            Run History
          </h3>

          {loadingRuns ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 text-cc-text-muted animate-spin" />
            </div>
          ) : globalRuns.length === 0 ? (
            <GlassCard hover={false} className="p-8 text-center">
              <History className="h-8 w-8 text-cc-text-muted mx-auto mb-3" />
              <p className="text-sm text-cc-text-secondary">No automation runs yet.</p>
              <p className="text-xs text-cc-text-muted mt-1">Workflows will log their executions here.</p>
            </GlassCard>
          ) : (
            <GlassCard hover={false} className="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow Name</TableHead>
                    <TableHead>Trigger Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalRuns.slice(0, globalRunsLimit).map(run => (
                    <GlobalRunRow
                      key={run.id}
                      run={run}
                      workflowName={workflowNameMap[run.workflow_id] || 'Unknown Workflow'}
                    />
                  ))}
                </TableBody>
              </Table>
              {globalRuns.length > globalRunsLimit && (
                <div className="p-3 border-t border-cc-border text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGlobalRunsLimit(prev => prev + 50)}
                    className="text-xs"
                  >
                    Load more ({globalRuns.length - globalRunsLimit} remaining)
                  </Button>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      )}

      {/* Editor modal */}
      <WorkflowEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={load}
        userId={userId}
        initial={editorInitial}
      />
    </div>
  )
}
