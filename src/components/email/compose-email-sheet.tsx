'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EMAIL_TEMPLATES, renderTemplate, type EmailTemplate } from '@/lib/email-templates'
import { createEmail } from '@/lib/emails'
import { logActivity } from '@/lib/queries'
import { Copy, ExternalLink, CheckCircle, ChevronDown, ChevronUp, Save } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  userId?: string
  onSent?: () => void
  entityType?: 'deal' | 'contact'
  entityId?: string
  defaultTo?: string
}

export function ComposeEmailSheet({ open, onClose, userId, onSent, entityType, entityId, defaultTo }: Props) {
  const [to, setTo] = useState(defaultTo || '')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (defaultTo) setTo(defaultTo)
  }, [defaultTo])

  useEffect(() => {
    if (open) {
      setTo(defaultTo || '')
      setCc('')
      setBcc('')
      setSubject('')
      setBody('')
      setSelectedTemplate('')
      setShowCcBcc(false)
    }
  }, [open, defaultTo])

  const handleTemplateSelect = (templateId: string | null) => {
    if (!templateId) return
    setSelectedTemplate(templateId)
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      const rendered = renderTemplate(template, { first_name: '', full_name: '', company: '', asset_type: '', budget_range: '', fee_percentage: '', stage: '' })
      setSubject(rendered.subject)
      setBody(rendered.body)
    }
  }

  const handleSend = async () => {
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}${cc ? `&cc=${encodeURIComponent(cc)}` : ''}${bcc ? `&bcc=${encodeURIComponent(bcc)}` : ''}`
    window.open(mailtoUrl)

    await createEmail({
      subject,
      body,
      to_address: to,
      from_address: null,
      cc: cc ? cc.split(',').map(s => s.trim()) : null,
      bcc: bcc ? bcc.split(',').map(s => s.trim()) : null,
      status: 'sent',
      sent_at: new Date().toISOString(),
      entity_type: entityType || null,
      entity_id: entityId || null,
      thread_id: null,
      template_id: selectedTemplate || null,
      created_by: userId || '',
    })

    if (entityType && entityId) {
      await logActivity({
        entity_type: entityType as 'contact' | 'deal',
        entity_id: entityId,
        action: 'email_drafted',
        description: `Email sent: "${subject}"`,
        created_by: userId,
      })
    }

    onSent?.()
    onClose()
  }

  const handleSaveDraft = async () => {
    await createEmail({
      subject,
      body,
      to_address: to,
      from_address: null,
      cc: cc ? cc.split(',').map(s => s.trim()) : null,
      bcc: bcc ? bcc.split(',').map(s => s.trim()) : null,
      status: 'draft',
      sent_at: null,
      entity_type: entityType || null,
      entity_id: entityId || null,
      thread_id: null,
      template_id: selectedTemplate || null,
      created_by: userId || '',
    })

    onSent?.()
    onClose()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`To: ${to}\nSubject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Compose Email</SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-4 px-1">
          {/* To */}
          <div>
            <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">To</Label>
            <Input
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="mt-1.5"
            />
          </div>

          {/* CC/BCC toggle */}
          <button
            onClick={() => setShowCcBcc(!showCcBcc)}
            className="flex items-center gap-1 text-xs text-cc-text-secondary hover:text-cc-text-primary transition-colors"
          >
            {showCcBcc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            CC / BCC
          </button>

          {showCcBcc && (
            <div className="space-y-3">
              <div>
                <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">CC</Label>
                <Input
                  value={cc}
                  onChange={e => setCc(e.target.value)}
                  placeholder="Comma-separated addresses"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">BCC</Label>
                <Input
                  value={bcc}
                  onChange={e => setBcc(e.target.value)}
                  placeholder="Comma-separated addresses"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Template selector */}
          <div>
            <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div>
            <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Subject</Label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Body */}
          <div>
            <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Body</Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              className="mt-1.5 min-h-[200px] font-mono text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" onClick={handleSend} disabled={!to || !subject}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Send
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveDraft}>
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Draft
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
