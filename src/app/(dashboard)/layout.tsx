import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { AmbientBackground } from '@/components/ambient-background'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--cc-bg)] relative">
      <AmbientBackground />
      <Sidebar />
      <div className="lg:pl-60 flex flex-col min-h-screen relative z-10">
        <TopBar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
