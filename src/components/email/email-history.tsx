'use client'

import { useEffect, useState } from 'react'
import { getEmails } from '@/lib/emails'
import type { Email } from '@/lib/types'
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

  if (emails.length === 0) {
    return <p className="text-xs text-cc-text-muted py-2 text-center">No emails logged</p>
  }

  return (
    <div className="space-y-2">
      {emails.slice(0, 5).map(email => (
        <div key={email.id} className="p-3 bg-cc-surface-2 border border-cc-border rounded-lg">
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
  )
}
