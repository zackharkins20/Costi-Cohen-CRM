'use client'

import { Sidebar, useSidebarWidth } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sidebarWidth = useSidebarWidth()

  return (
    <div className="min-h-screen bg-cc-bg relative">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen relative z-10"
        style={{
          paddingLeft: sidebarWidth,
          transition: 'padding-left 250ms ease',
        }}
      >
        <TopBar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
