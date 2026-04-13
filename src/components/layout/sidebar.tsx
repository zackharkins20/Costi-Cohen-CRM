'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/queries'
import { useTheme } from '@/components/theme-provider'

const SIDEBAR_EXPANDED_WIDTH = 256 // 16rem
const SIDEBAR_COLLAPSED_WIDTH = 72
const LS_KEY = 'sidebar-collapsed'

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

export function useSidebarWidth() {
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    setCollapsed(localStorage.getItem(LS_KEY) === 'true')
    const handler = () => setCollapsed(localStorage.getItem(LS_KEY) === 'true')
    window.addEventListener('sidebar-toggle', handler)
    return () => window.removeEventListener('sidebar-toggle', handler)
  }, [])
  return collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setCollapsed(localStorage.getItem(LS_KEY) === 'true')
  }, [])

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user?.role === 'Admin') setIsAdmin(true)
    })
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(LS_KEY, String(next))
    window.dispatchEvent(new Event('sidebar-toggle'))
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  /* ─── Nav link with optional tooltip ─── */
  const NavLink = ({ item }: { item: typeof navigation[number] }) => {
    const active = isActive(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? item.label : undefined}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-normal transition-all duration-150',
          collapsed && 'justify-center px-0',
          active
            ? 'text-cc-text-primary font-medium border-l-2 border-cc-text-primary pl-[10px]'
            : 'text-cc-text-secondary hover:text-cc-text-primary',
          collapsed && active && 'pl-0 border-l-0',
        )}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
        {/* Tooltip */}
        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-cc-surface-2 border border-cc-border px-2.5 py-1 text-xs text-cc-text-primary opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {item.label}
          </span>
        )}
      </Link>
    )
  }

  /* ─── Mobile nav content (always expanded) ─── */
  const mobileNavContent = (
    <>
      <div className="px-5 py-7 border-b border-cc-border">
        <Image
          src="/logo.jpg"
          alt="Costi Cohen"
          width={160}
          height={40}
          className="h-6 w-auto"
          style={{ filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
          priority
        />
        <p className="text-[10px] uppercase tracking-[0.25em] text-cc-text-secondary mt-1.5 font-normal">
          Property Advisory
        </p>
      </div>
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
            {mobileNavContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-cc-surface border-r border-cc-border z-30 overflow-hidden"
        style={{
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
          transition: 'width 250ms ease',
        }}
      >
        {/* Logo area */}
        <div className={cn(
          'border-b border-cc-border transition-all duration-250',
          collapsed ? 'px-0 py-5 flex items-center justify-center' : 'px-5 py-7',
        )}>
          {collapsed ? (
            <span
              className="text-[20px] font-light uppercase tracking-[0.15em] text-cc-text-primary select-none"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              CC
            </span>
          ) : (
            <>
              <Image
                src="/logo.jpg"
                alt="Costi Cohen"
                width={160}
                height={40}
                className="h-5 w-auto"
                style={{ filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
                priority
              />
              <p className="text-[10px] uppercase tracking-[0.25em] text-cc-text-secondary mt-1.5 font-normal">
                Property Advisory
              </p>
            </>
          )}
        </div>

        {/* Nav items */}
        <nav className={cn(
          'flex-1 py-5 space-y-1 overflow-y-auto overflow-x-hidden',
          collapsed ? 'px-3' : 'px-3',
        )}>
          {navigation.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
          {isAdmin && (
            <>
              {!collapsed && (
                <div className="pt-3 pb-1 px-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-cc-text-muted font-medium">Admin</p>
                </div>
              )}
              {collapsed && <div className="pt-2" />}
              {adminNavigation.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-cc-border px-3 py-4">
          {/* Collapse toggle */}
          <button
            onClick={toggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-cc-text-secondary hover:text-cc-text-primary transition-all w-full',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-cc-surface-2 border border-cc-border px-2.5 py-1 text-xs text-cc-text-primary opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Expand
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={collapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
            className={cn(
              'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-cc-text-secondary hover:text-cc-text-primary transition-all w-full',
              collapsed && 'justify-center px-0',
            )}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-cc-surface-2 border border-cc-border px-2.5 py-1 text-xs text-cc-text-primary opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            title={collapsed ? 'Sign Out' : undefined}
            className={cn(
              'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-normal text-cc-text-secondary hover:text-cc-text-primary transition-all w-full',
              collapsed && 'justify-center px-0',
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign Out</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-cc-surface-2 border border-cc-border px-2.5 py-1 text-xs text-cc-text-primary opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
