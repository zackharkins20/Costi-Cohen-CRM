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
    <header className="sticky top-0 z-20 h-16 border-b border-[#222222] bg-[#000000]/90 backdrop-blur-xl flex items-center px-8 gap-4">
      {/* Search */}
      <div className="flex-1 max-w-md ml-12 lg:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555555]" />
          <Input
            placeholder="Search contacts, deals..."
            className="pl-9 bg-[#111111] border-[#222222] text-white placeholder:text-[#555555] h-9"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 hover:bg-[#111111] transition-colors"
        >
          <Bell className="h-5 w-5 text-[#A0A7AB]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-white" />
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-[#0a0a0a] border border-[#222222] overflow-hidden z-50 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222]">
              <h3 className="text-sm font-medium text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-white hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[#555555] text-center">
                  No notifications
                </p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-[#222222] last:border-0 ${
                      !n.read ? 'bg-[#111111]' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-[#A0A7AB] mt-0.5">{n.message}</p>
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
