'use client'

import { useEffect, useState } from 'react'
import { getEmails } from '@/lib/emails'
import type { Email } from '@/lib/types'
import { Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  entityType: 'deal' | 'contact'
  entityId: string
}

export function EmailHistory({ entityType, entityId }: Props) {
  const [emails, setEmails] = useState<Email[]>([])

  useEffect(() => {
    getEmails(entityType, entityId).then(setEmails)
  }, [entityType, entityId])

  const getStatusStyle = (status: Email['status']) => {
    switch (status) {
      case 'sent':
        return 'border-cc-text-primary text-cc-text-primary border-2'
      case 'draft':
        return 'border-cc-text-secondary text-cc-text-secondary'
      case 'failed':
        return 'border-cc-text-muted text-cc-text-muted border-dashed'
    }
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-cc-text-primary mb-3 flex items-center gap-2">
        <Mail className="h-3.5 w-3.5" /> Email History
      </h4>
      {emails.length === 0 ? (
        <p className="text-xs text-cc-text-muted py-3">No emails logged</p>
      ) : (
        <div className="space-y-2">
          {emails.slice(0, 5).map(email => (
            <div key={email.id} className="p-3 bg-cc-surface-2 border border-cc-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-cc-text-primary font-medium truncate flex-1">{email.subject || '(no subject)'}</span>
                <span className={`inline-flex px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-medium border rounded-md flex-shrink-0 ${getStatusStyle(email.status)}`}>
                  {email.status}
                </span>
              </div>
              <p className="text-xs text-cc-text-secondary">To: {email.to_address}</p>
              <p className="text-[10px] text-cc-text-muted mt-1">
                {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
              </p>
            </div>
          ))}
          {emails.length > 5 && (
            <p className="text-xs text-cc-text-muted text-center">+ {emails.length - 5} more emails</p>
          )}
        </div>
      )}
    </div>
  )
}
