'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  FileText,
  CheckSquare,
  Settings,
  Shield,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getCurrentUser } from '@/lib/queries'

const navigation = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Pipeline', href: '/pipeline', icon: TrendingUp },
  { label: 'Contacts', href: '/contacts', icon: Users },
  { label: 'Deals', href: '/deals', icon: FileText },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const adminNavigation = [
  { label: 'Team', href: '/team', icon: Shield },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user?.role === 'Admin') setIsAdmin(true)
    })
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-7 border-b border-[var(--cc-border)]">
        <h1 className="text-xl text-[var(--cc-gold)] tracking-wide" style={{ fontFamily: "var(--font-heading), 'Cormorant Garamond', serif" }}>
          Costi Cohen
        </h1>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--cc-text-muted)] mt-1 font-medium">
          Property Advisory
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navigation.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-[var(--cc-gold-soft)] text-[var(--cc-gold)] border-l-2 border-[var(--cc-gold)]'
                  : 'text-[var(--cc-text-tertiary)] hover:bg-[var(--cc-surface-2)] hover:text-[var(--cc-text-primary)]'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[var(--cc-text-muted)] font-medium">Admin</p>
            </div>
            {adminNavigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-[var(--cc-gold-soft)] text-[var(--cc-gold)] border-l-2 border-[var(--cc-gold)]'
                      : 'text-[var(--cc-text-tertiary)] hover:bg-[var(--cc-surface-2)] hover:text-[var(--cc-text-primary)]'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[var(--cc-border)]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--cc-text-tertiary)] hover:bg-[var(--cc-surface-2)] hover:text-[var(--cc-text-primary)] transition-all w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--cc-surface)] border border-[var(--cc-border)] lg:hidden"
      >
        <Menu className="h-5 w-5 text-[var(--cc-text-primary)]" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full bg-[var(--cc-surface)] border-r border-[var(--cc-border)] flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1"
            >
              <X className="h-5 w-5 text-[var(--cc-text-tertiary)]" />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 bg-[var(--cc-surface)] border-r border-[var(--cc-border)] z-30">
        {navContent}
      </aside>
    </>
  )
}
