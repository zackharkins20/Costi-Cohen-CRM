import type { PropertyStage } from './types'

interface StageColor {
  bg: string
  text: string
  dot: string
}

const lightStageColors: Record<PropertyStage, StageColor> = {
  lead: { bg: '#E5E7EB', text: '#374151', dot: '#6B7280' },
  initial_call: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  property_search: { bg: '#CFFAFE', text: '#155E75', dot: '#06B6D4' },
  due_diligence: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  exchange: { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  fees_collected: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
}

const darkStageColors: Record<PropertyStage, StageColor> = {
  lead: { bg: '#374151', text: '#D1D5DB', dot: '#9CA3AF' },
  initial_call: { bg: '#1E3A5F', text: '#93C5FD', dot: '#60A5FA' },
  property_search: { bg: '#164E63', text: '#67E8F9', dot: '#22D3EE' },
  due_diligence: { bg: '#78350F', text: '#FCD34D', dot: '#FBBF24' },
  exchange: { bg: '#4C1D95', text: '#C4B5FD', dot: '#A78BFA' },
  fees_collected: { bg: '#064E3B', text: '#6EE7B7', dot: '#34D399' },
}

export function getStageColor(stage: PropertyStage, isDark: boolean): StageColor {
  return isDark ? darkStageColors[stage] : lightStageColors[stage]
}

interface AssetTypeColor {
  bg: string
  text: string
}

const lightAssetTypeColors: Record<string, AssetTypeColor> = {
  office: { bg: '#DBEAFE', text: '#1E40AF' },
  retail: { bg: '#D1FAE5', text: '#065F46' },
  industrial: { bg: '#FEF3C7', text: '#92400E' },
  development: { bg: '#EDE9FE', text: '#5B21B6' },
  'development site': { bg: '#EDE9FE', text: '#5B21B6' },
  'mixed use': { bg: '#CFFAFE', text: '#155E75' },
  'owner occupier': { bg: '#F1F5F9', text: '#475569' },
}

const darkAssetTypeColors: Record<string, AssetTypeColor> = {
  office: { bg: '#1E3A5F', text: '#93C5FD' },
  retail: { bg: '#064E3B', text: '#6EE7B7' },
  industrial: { bg: '#78350F', text: '#FCD34D' },
  development: { bg: '#4C1D95', text: '#C4B5FD' },
  'development site': { bg: '#4C1D95', text: '#C4B5FD' },
  'mixed use': { bg: '#164E63', text: '#67E8F9' },
  'owner occupier': { bg: '#334155', text: '#CBD5E1' },
}

const defaultAssetLight: AssetTypeColor = { bg: '#F3F4F6', text: '#6B7280' }
const defaultAssetDark: AssetTypeColor = { bg: '#374151', text: '#9CA3AF' }

export function getAssetTypeColor(assetType: string, isDark: boolean): AssetTypeColor {
  const key = assetType.toLowerCase().trim()
  if (isDark) {
    return darkAssetTypeColors[key] || defaultAssetDark
  }
  return lightAssetTypeColors[key] || defaultAssetLight
}
