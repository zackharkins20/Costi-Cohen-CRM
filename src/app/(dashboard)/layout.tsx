'use client'

import { useCallback } from 'react'
import { Sidebar, useSidebarWidth } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { WhatsNewModal, useWhatsNew } from '@/components/whats-new-modal'
import { FeatureTour, useTour } from '@/components/feature-tour'

const TOUR_LS_KEY = 'costicohen_tour_completed'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sidebarWidth = useSidebarWidth()
  const { showWhatsNew, closeWhatsNew } = useWhatsNew()
  const { tourActive, startTour, completeTour } = useTour()

  const handleWhatsNewClose = useCallback(() => {
    closeWhatsNew()
    // Auto-start tour for new users after What's New is dismissed
    const tourCompleted = localStorage.getItem(TOUR_LS_KEY)
    if (!tourCompleted) {
      setTimeout(() => startTour(), 400)
    }
  }, [closeWhatsNew, startTour])

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
      <WhatsNewModal open={showWhatsNew} onClose={handleWhatsNewClose} />
      <FeatureTour active={tourActive} onComplete={completeTour} />
    </div>
  )
}
