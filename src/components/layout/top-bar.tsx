'use client'

import { useState, useEffect } from 'react'
import { Search, Bell } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getNotifications, markAllNotificationsRead } from '@/lib/queries'
import { getCurrentUser } from '@/lib/queries'
import type { Notification } from '@/lib/types'

export function TopBar() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) {
        setUserId(user.id)
        getNotifications(user.id).then(setNotifications)
      }
    })
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAllRead = async () => {
    if (!userId) return
    await markAllNotificationsRead(userId)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-[var(--cc-divider)] bg-[var(--cc-bg)]/80 backdrop-blur-xl flex items-center px-6 gap-4">
      {/* Search */}
      <div className="flex-1 max-w-md ml-12 lg:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cc-text-muted)]" />
          <Input
            placeholder="Search contacts, deals..."
            className="pl-9 bg-[var(--cc-glass-bg)] border-[var(--cc-glass-border)] text-[var(--cc-text-primary)] placeholder:text-[var(--cc-text-muted)] h-9"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-lg hover:bg-[var(--cc-glass-hover)] transition-colors"
        >
          <Bell className="h-5 w-5 text-[var(--cc-text-secondary)]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--cc-accent)] rounded-full" />
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-80 glass-card p-0 overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cc-divider)]">
              <h3 className="text-sm font-medium text-[var(--cc-text-primary)]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[var(--cc-accent)] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[var(--cc-text-muted)] text-center">
                  No notifications
                </p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-[var(--cc-divider)] last:border-0 ${
                      !n.read ? 'bg-[var(--cc-accent-soft)]' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-[var(--cc-text-primary)]">{n.title}</p>
                    <p className="text-xs text-[var(--cc-text-tertiary)] mt-0.5">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
