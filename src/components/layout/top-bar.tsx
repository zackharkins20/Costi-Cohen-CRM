'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/queries'
import { getCurrentUser } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import type { Notification } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

function getEntityUrl(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null
  switch (entityType) {
    case 'deal': return `/deals`
    case 'contact': return `/contacts`
    case 'task': return `/tasks`
    default: return null
  }
}

export function TopBar() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async (uid: string) => {
    const data = await getNotifications(uid)
    setNotifications(data)
  }, [])

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) {
        setUserId(user.id)
        loadNotifications(user.id)
      }
    })
  }, [loadNotifications])

  // Supabase Realtime subscription for live notifications
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev].slice(0, 30))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAllRead = async () => {
    if (!userId) return
    await markAllNotificationsRead(userId)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await markNotificationRead(n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
    const url = getEntityUrl(n.entity_type, n.entity_id)
    if (url) {
      setShowNotifications(false)
      router.push(url)
    }
  }

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-cc-border bg-cc-bg/90 backdrop-blur-xl flex items-center px-8 gap-4">
      {/* Search */}
      <div className="flex-1 max-w-md ml-12 lg:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cc-text-muted" />
          <Input
            placeholder="Search contacts, deals..."
            className="pl-9 bg-cc-surface-2 border-cc-border text-cc-text-primary placeholder:text-cc-text-muted h-9"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 hover:bg-cc-surface-2 rounded-md transition-colors"
        >
          <Bell className="h-5 w-5 text-cc-text-secondary" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-cc-text-primary text-cc-bg text-[10px] font-semibold rounded-full px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-96 bg-cc-surface border border-cc-border rounded-lg overflow-hidden z-50 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cc-border">
              <h3 className="text-sm font-medium text-cc-text-primary">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs text-cc-text-muted">({unreadCount} unread)</span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-cc-text-secondary hover:text-cc-text-primary transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-sm text-cc-text-muted text-center">
                  No notifications yet
                </p>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-cc-border last:border-0 hover:bg-cc-surface-2 transition-colors flex gap-3 ${
                      !n.read ? 'bg-cc-surface-2/50' : ''
                    }`}
                  >
                    {/* Unread dot */}
                    <div className="pt-1.5 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${!n.read ? 'bg-cc-text-primary' : 'bg-transparent'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${!n.read ? 'font-medium text-cc-text-primary' : 'text-cc-text-secondary'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-cc-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-cc-text-muted mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
