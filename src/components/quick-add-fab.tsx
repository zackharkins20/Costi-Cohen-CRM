'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, Users, CheckSquare, Calendar, Mail, X } from 'lucide-react'
import { CreateDealForm } from '@/components/forms/create-deal-form'
import { CreateContactForm } from '@/components/forms/create-contact-form'
import { CreateTaskForm } from '@/components/forms/create-task-form'
import { EventModal } from '@/components/events/event-modal'
import { ComposeEmailSheet } from '@/components/email/compose-email-sheet'
import { getCurrentUser } from '@/lib/queries'

const MENU_ITEMS = [
  { key: 'deal', label: 'New Deal', icon: FileText },
  { key: 'contact', label: 'New Contact', icon: Users },
  { key: 'task', label: 'New Task', icon: CheckSquare },
  { key: 'event', label: 'New Event', icon: Calendar },
  { key: 'email', label: 'Compose Email', icon: Mail },
] as const

type MenuAction = (typeof MENU_ITEMS)[number]['key']

export function QuickAddFab() {
  const [open, setOpen] = useState(false)
  const [activeForm, setActiveForm] = useState<MenuAction | null>(null)
  const [userId, setUserId] = useState<string>()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
  }, [])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open, close])

  const handleAction = (action: MenuAction) => {
    setOpen(false)
    setActiveForm(action)
  }

  const noop = () => {}

  return (
    <>
      <div ref={menuRef} className="fixed bottom-8 right-8 z-50" data-tour="quick-add">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 10 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-16 right-0 mb-2 flex flex-col gap-2 items-end"
            >
              {MENU_ITEMS.map((item, i) => (
                <motion.button
                  key={item.key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleAction(item.key)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-cc-surface border border-cc-border shadow-lg hover:bg-cc-surface-2 transition-colors whitespace-nowrap"
                >
                  <item.icon className="h-4 w-4 text-cc-text-secondary" />
                  <span className="text-sm font-medium text-cc-text-primary">{item.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(prev => !prev)}
          className="w-14 h-14 rounded-full bg-[#3B5068] text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
          whileTap={{ scale: 0.93 }}
        >
          <motion.div
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </motion.div>
        </motion.button>
      </div>

      {/* Forms */}
      <CreateDealForm
        open={activeForm === 'deal'}
        onClose={() => setActiveForm(null)}
        onCreated={noop}
        userId={userId}
      />
      <CreateContactForm
        open={activeForm === 'contact'}
        onClose={() => setActiveForm(null)}
        onCreated={noop}
        userId={userId}
      />
      <CreateTaskForm
        open={activeForm === 'task'}
        onClose={() => setActiveForm(null)}
        onCreated={noop}
        userId={userId}
      />
      <EventModal
        open={activeForm === 'event'}
        onClose={() => setActiveForm(null)}
        onSaved={noop}
        userId={userId}
      />
      <ComposeEmailSheet
        open={activeForm === 'email'}
        onClose={() => setActiveForm(null)}
        userId={userId}
      />
    </>
  )
}
