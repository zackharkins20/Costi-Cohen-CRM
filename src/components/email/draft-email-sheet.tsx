'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EMAIL_TEMPLATES, renderTemplate, getTemplateVariables, type EmailTemplate } from '@/lib/email-templates'
import { logActivity } from '@/lib/queries'
import type { Contact } from '@/lib/types'
import { Copy, ExternalLink, CheckCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  contact: Contact
  userId?: string
}

export function DraftEmailSheet({ open, onClose, contact, userId }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [copied, setCopied] = useState(false)

  const variables = getTemplateVariables(contact)
  const genericTemplates = EMAIL_TEMPLATES.filter(t => t.category === 'generic')
  const propertyTemplates = EMAIL_TEMPLATES.filter(t => t.category === 'property')

  useEffect(() => {
    if (selectedTemplate) {
      const rendered = renderTemplate(selectedTemplate, variables)
      setSubject(rendered.subject)
      setBody(rendered.body)
    }
  }, [selectedTemplate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyAll = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenMail = () => {
    const mailtoUrl = `mailto:${contact.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl)
  }

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${contact.email || ''}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(gmailUrl, '_blank')
  }

  const handleMarkSent = async () => {
    await logActivity({
      entity_type: 'contact',
      entity_id: contact.id,
      action: 'email_drafted',
      description: `Email drafted: "${subject}" using template "${selectedTemplate?.name || 'Custom'}"`,
      created_by: userId,
    })
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-[var(--cc-surface)] border-[var(--cc-glass-border)] overflow-y-auto w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-[var(--cc-text-primary)]">
            Draft Email to {contact.name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 px-1">
          {/* Template picker */}
          <div>
            <Label className="text-[var(--cc-text-secondary)] text-xs mb-2 block">Template</Label>
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--cc-text-muted)]">Generic</p>
              <div className="flex flex-wrap gap-1.5">
                {genericTemplates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      selectedTemplate?.id === t.id
                        ? 'bg-[var(--cc-accent-soft)] text-[var(--cc-accent)] border-[var(--cc-accent)]/30'
                        : 'bg-[var(--cc-glass-bg)] text-[var(--cc-text-secondary)] border-[var(--cc-glass-border)] hover:bg-[var(--cc-glass-hover)]'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--cc-text-muted)] mt-3">Property</p>
              <div className="flex flex-wrap gap-1.5">
                {propertyTemplates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      selectedTemplate?.id === t.id
                        ? 'bg-[var(--cc-accent-soft)] text-[var(--cc-accent)] border-[var(--cc-accent)]/30'
                        : 'bg-[var(--cc-glass-bg)] text-[var(--cc-text-secondary)] border-[var(--cc-glass-border)] hover:bg-[var(--cc-glass-hover)]'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label className="text-[var(--cc-text-secondary)] text-xs">Subject</Label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="mt-1 bg-[var(--cc-glass-bg)] border-[var(--cc-glass-border)] text-[var(--cc-text-primary)]"
            />
          </div>

          {/* Body */}
          <div>
            <Label className="text-[var(--cc-text-secondary)] text-xs">Body</Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              className="mt-1 bg-[var(--cc-glass-bg)] border-[var(--cc-glass-border)] text-[var(--cc-text-primary)] min-h-[200px] font-mono text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyAll} className="border-[var(--cc-glass-border)] text-[var(--cc-text-secondary)]">
              {copied ? <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-[var(--cc-accent)]" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              {copied ? 'Copied!' : 'Copy All'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenMail} className="border-[var(--cc-glass-border)] text-[var(--cc-text-secondary)]">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open in Mail
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenGmail} className="border-[var(--cc-glass-border)] text-[var(--cc-text-secondary)]">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open in Gmail
            </Button>
            <Button size="sm" onClick={handleMarkSent} className="bg-[var(--cc-accent)] text-white ml-auto">
              Mark as Sent
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
