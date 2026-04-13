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
  Sun,
  Moon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getCurrentUser } from '@/lib/queries'
import { useTheme } from '@/components/theme-provider'

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
  const { theme, toggleTheme } = useTheme()

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
      <div className="px-5 py-7 border-b border-cc-border">
        <h1 className="text-lg font-semibold text-cc-text-primary uppercase tracking-[0.15em]">
          Costi Cohen
        </h1>
        <p className="text-[10px] uppercase tracking-[0.25em] text-cc-text-secondary mt-1 font-normal">
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
                'flex items-center gap-3 px-3 py-2.5 text-sm font-normal transition-all duration-150',
                active
                  ? 'text-cc-text-primary font-medium border-l-2 border-cc-text-primary pl-[10px]'
                  : 'text-cc-text-secondary hover:text-cc-text-primary'
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
              <p className="text-[10px] uppercase tracking-[0.15em] text-cc-text-muted font-medium">Admin</p>
            </div>
            {adminNavigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-normal transition-all duration-150',
                    active
                      ? 'text-cc-text-primary font-medium border-l-2 border-cc-text-primary pl-[10px]'
                      : 'text-cc-text-secondary hover:text-cc-text-primary'
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

      {/* Theme toggle + Sign out */}
      <div className="px-3 py-4 border-t border-cc-border">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-cc-text-secondary hover:text-cc-text-primary transition-all w-full"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-cc-text-secondary hover:text-cc-text-primary transition-all w-full"
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
        className="fixed top-4 left-4 z-50 p-2 bg-cc-surface border border-cc-border lg:hidden"
      >
        <Menu className="h-5 w-5 text-cc-text-primary" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-cc-bg/80" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full bg-cc-surface border-r border-cc-border flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1"
            >
              <X className="h-5 w-5 text-cc-text-secondary" />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 bg-cc-surface border-r border-cc-border z-30">
        {navContent}
      </aside>
    </>
  )
}
