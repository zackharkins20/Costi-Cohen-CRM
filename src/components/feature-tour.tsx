'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

const LS_KEY = 'costicohen_tour_completed'

export interface TourStep {
  target: string // data-tour attribute value
  title: string
  description: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'sidebar',
    title: 'Sidebar Navigation',
    description: 'Navigate between all sections of The Exchange. Collapse for more space or expand for labels.',
  },
  {
    target: 'dashboard-metrics',
    title: 'Dashboard Metrics',
    description: 'Track your pipeline value and activity at a glance. Key numbers update in real-time.',
  },
  {
    target: 'notifications',
    title: 'Notifications',
    description: 'Stay updated on deal movements, task assignments, and team activity.',
  },
  {
    target: 'global-search',
    title: 'Global Search',
    description: 'Search contacts, deals, and tasks instantly from anywhere in The Exchange.',
  },
  {
    target: 'pipeline-nav',
    title: 'Pipeline',
    description: 'Drag and drop deals through your pipeline stages on an interactive kanban board.',
  },
  {
    target: 'tasks-nav',
    title: 'Tasks',
    description: 'Manage tasks with subtasks, priorities, and due dates. Drag between status columns.',
  },
  {
    target: 'calendar-nav',
    title: 'Calendar',
    description: 'View and create events linked to your deals and contacts. Track meetings and deadlines.',
  },
  {
    target: 'reports-nav',
    title: 'Reports',
    description: 'Analyse pipeline, revenue, activity, and contact data with customisable date ranges.',
  },
]

interface TooltipPosition {
  top: number
  left: number
  arrowSide: 'left' | 'right' | 'top' | 'bottom'
}

function getTooltipPosition(rect: DOMRect): TooltipPosition {
  const tooltipWidth = 300
  const tooltipHeight = 160
  const gap = 16

  // Default: position to the right of the element
  let top = rect.top + rect.height / 2 - tooltipHeight / 2
  let left = rect.right + gap
  let arrowSide: TooltipPosition['arrowSide'] = 'left'

  // If tooltip goes off right edge, position to the left
  if (left + tooltipWidth > window.innerWidth - 20) {
    left = rect.left - tooltipWidth - gap
    arrowSide = 'right'
  }

  // If tooltip goes off left edge, position below
  if (left < 20) {
    left = rect.left + rect.width / 2 - tooltipWidth / 2
    top = rect.bottom + gap
    arrowSide = 'top'
  }

  // Clamp to viewport
  top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20))
  left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20))

  return { top, left, arrowSide }
}

interface FeatureTourProps {
  active: boolean
  onComplete: () => void
}

export function FeatureTour({ active, onComplete }: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ top: 0, left: 0, arrowSide: 'left' })
  const overlayRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!active) return
    const step = TOUR_STEPS[currentStep]
    if (!step) return

    const element = document.querySelector(`[data-tour="${step.target}"]`)
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)
      setTooltipPos(getTooltipPosition(rect))
    }
  }, [active, currentStep])

  useEffect(() => {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [updatePosition])

  // Re-measure when sidebar might still be animating
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(updatePosition, 300)
    return () => clearTimeout(timer)
  }, [active, currentStep, updatePosition])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    localStorage.setItem(LS_KEY, 'true')
    setCurrentStep(0)
    onComplete()
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!active || !targetRect) return null

  const step = TOUR_STEPS[currentStep]
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100
  const isLast = currentStep === TOUR_STEPS.length - 1
  const padding = 8

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
      {/* Overlay with spotlight cutout */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.60)`,
          clipPath: `polygon(
            0% 0%, 0% 100%, 100% 100%, 100% 0%,
            ${targetRect.left - padding}px 0%,
            ${targetRect.left - padding}px ${targetRect.bottom + padding}px,
            ${targetRect.right + padding}px ${targetRect.bottom + padding}px,
            ${targetRect.right + padding}px ${targetRect.top - padding}px,
            ${targetRect.left - padding}px ${targetRect.top - padding}px,
            ${targetRect.left - padding}px 0%
          )`,
        }}
        onClick={handleSkip}
      />

      {/* Spotlight border */}
      <div
        className="absolute pointer-events-none rounded-lg"
        style={{
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          border: '2px solid rgba(255, 255, 255, 0.3)',
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute bg-cc-surface border border-cc-border rounded-xl shadow-2xl w-[300px] p-5 z-[10000]"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
        }}
      >
        {/* Progress bar */}
        <div className="h-1 w-full bg-cc-surface-2 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-cc-text-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step counter */}
        <p className="text-[10px] text-cc-text-muted uppercase tracking-wider mb-2">
          Step {currentStep + 1} of {TOUR_STEPS.length}
        </p>

        <h3 className="text-sm font-semibold text-cc-text-primary mb-1.5">{step.title}</h3>
        <p className="text-xs text-cc-text-secondary leading-relaxed mb-5">{step.description}</p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-xs text-cc-text-muted hover:text-cc-text-secondary transition-colors"
          >
            Skip tour
          </button>
          <Button size="sm" onClick={handleNext}>
            {isLast ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useTour() {
  const [tourActive, setTourActive] = useState(false)

  const startTour = useCallback(() => {
    try {
      if (localStorage.getItem(LS_KEY) === 'true') return
    } catch {}
    setTourActive(true)
  }, [])

  const completeTour = useCallback(() => {
    try { localStorage.setItem(LS_KEY, 'true') } catch {}
    setTourActive(false)
  }, [])

  const isTourCompleted = useCallback(() => {
    try {
      return localStorage.getItem(LS_KEY) === 'true'
    } catch {
      return false
    }
  }, [])

  return {
    tourActive,
    startTour,
    completeTour,
    isTourCompleted,
  }
}
