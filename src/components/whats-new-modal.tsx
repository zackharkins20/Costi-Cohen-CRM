'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CHANGELOG_ENTRIES, CURRENT_VERSION, type ChangelogCategory } from '@/lib/changelog'
import {
  Zap, Compass, Mail, BarChart3, FileText, Calendar,
  Bell, CheckSquare, Palette, LogIn, Sparkles,
} from 'lucide-react'

const LS_KEY = 'costicohen_last_seen_version'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Compass, Mail, BarChart3, FileText, Calendar,
  Bell, CheckSquare, Palette, LogIn,
}

const CATEGORY_STYLES: Record<ChangelogCategory, string> = {
  new: 'bg-cc-text-primary text-cc-bg',
  improved: 'bg-cc-text-secondary text-cc-bg',
  fixed: 'bg-cc-surface-3 text-cc-text-secondary',
}

const CATEGORY_LABELS: Record<ChangelogCategory, string> = {
  new: 'New',
  improved: 'Improved',
  fixed: 'Fixed',
}

interface WhatsNewModalProps {
  open: boolean
  onClose: () => void
}

export function WhatsNewModal({ open, onClose }: WhatsNewModalProps) {
  const handleClose = () => {
    localStorage.setItem(LS_KEY, CURRENT_VERSION)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cc-text-secondary" />
            What&apos;s New
          </DialogTitle>
          <p className="text-xs text-cc-text-muted mt-1">
            Version {CURRENT_VERSION} &mdash; Latest updates and improvements
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 mt-2 space-y-1">
          {CHANGELOG_ENTRIES.map((entry) => {
            const IconComponent = ICON_MAP[entry.icon]
            return (
              <div
                key={entry.id}
                className="flex gap-3 py-3 border-b border-cc-border last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-cc-surface-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {IconComponent ? (
                    <IconComponent className="h-4 w-4 text-cc-text-secondary" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-cc-text-secondary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-cc-text-primary">{entry.title}</h4>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${CATEGORY_STYLES[entry.category]}`}>
                      {CATEGORY_LABELS[entry.category]}
                    </span>
                  </div>
                  <p className="text-xs text-cc-text-secondary leading-relaxed">{entry.description}</p>
                  <p className="text-[10px] text-cc-text-muted mt-1">{entry.location}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t border-cc-border flex justify-end">
          <Button onClick={handleClose}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function useWhatsNew() {
  const [showWhatsNew, setShowWhatsNew] = useState(false)

  useEffect(() => {
    const lastSeen = localStorage.getItem(LS_KEY)
    if (lastSeen !== CURRENT_VERSION) {
      setShowWhatsNew(true)
    }
  }, [])

  return {
    showWhatsNew,
    setShowWhatsNew,
    openWhatsNew: () => setShowWhatsNew(true),
    closeWhatsNew: () => {
      localStorage.setItem(LS_KEY, CURRENT_VERSION)
      setShowWhatsNew(false)
    },
  }
}
