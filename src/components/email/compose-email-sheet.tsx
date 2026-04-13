'use client'

import { useState, useEffect, useRef } from 'react'
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
import { createClient } from '@/lib/supabase'
import { formatFileSize } from '@/lib/documents'
import { Copy, ExternalLink, CheckCircle, ChevronDown, ChevronUp, Save, Paperclip, X, FileText, Loader2 } from 'lucide-react'

interface Attachment {
  file: File
  name: string
  size: number
  storagePath: string | null
  uploading: boolean
  error?: string
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp'

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
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setAttachments([])
    }
  }, [open, defaultTo])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      const attachment: Attachment = {
        file,
        name: file.name,
        size: file.size,
        storagePath: null,
        uploading: true,
      }
      setAttachments(prev => [...prev, attachment])

      try {
        const supabase = createClient()
        const filePath = `email-attachments/${Date.now()}_${file.name}`
        const { error } = await supabase.storage.from('documents').upload(filePath, file)
        if (error) {
          setAttachments(prev =>
            prev.map(a => a.file === file ? { ...a, uploading: false, error: 'Upload failed' } : a)
          )
        } else {
          setAttachments(prev =>
            prev.map(a => a.file === file ? { ...a, uploading: false, storagePath: filePath } : a)
          )
        }
      } catch {
        setAttachments(prev =>
          prev.map(a => a.file === file ? { ...a, uploading: false, error: 'Upload failed' } : a)
        )
      }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = async (index: number) => {
    const att = attachments[index]
    if (att.storagePath) {
      const supabase = createClient()
      await supabase.storage.from('documents').remove([att.storagePath])
    }
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

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
    // Build body with attachment references
    let fullBody = body
    const uploadedAttachments = attachments.filter(a => a.storagePath && !a.error)
    if (uploadedAttachments.length > 0) {
      fullBody += '\n\n---\nAttachments (via The Exchange CRM):\n'
      uploadedAttachments.forEach(a => {
        fullBody += `- ${a.name} (${formatFileSize(a.size)})\n`
      })
    }

    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}${cc ? `&cc=${encodeURIComponent(cc)}` : ''}${bcc ? `&bcc=${encodeURIComponent(bcc)}` : ''}`
    window.open(mailtoUrl)

    await createEmail({
      subject,
      body: fullBody,
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
        description: `Email sent: "${subject}"${uploadedAttachments.length > 0 ? ` with ${uploadedAttachments.length} attachment(s)` : ''}`,
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

          {/* Attachments */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-cc-text-secondary hover:text-cc-text-primary transition-colors"
            >
              <Paperclip className="h-3.5 w-3.5" /> Attach Files
            </button>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                      att.error
                        ? 'border-cc-destructive text-cc-destructive bg-cc-surface-2'
                        : 'border-cc-border text-cc-text-secondary bg-cc-surface-2'
                    }`}
                  >
                    {att.uploading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                    <span className="max-w-[140px] truncate">{att.name}</span>
                    <span className="text-cc-text-muted">{formatFileSize(att.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="ml-0.5 hover:text-cc-text-primary transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" onClick={handleSend} disabled={!to || !subject || attachments.some(a => a.uploading)}>
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
