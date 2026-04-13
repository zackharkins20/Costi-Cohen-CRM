import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLabel(snakeCaseKey: string): string {
  return snakeCaseKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format Australian phone numbers to `04XX XXX XXX` display format.
 * Handles various input formats: +614XXXXXXXX, 04XXXXXXXX, 4XXXXXXXX, etc.
 */
export function formatPhone(phone: string): string {
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Handle Australian mobile: +61 4XX XXX XXX or 04XX XXX XXX
  if (digits.startsWith('614') && digits.length === 11) {
    const local = '0' + digits.slice(2) // Convert +614... to 04...
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
  }

  if (digits.startsWith('04') && digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }

  // Handle Australian landline: +61 2 XXXX XXXX or 02 XXXX XXXX
  if (digits.startsWith('61') && digits.length === 11) {
    const local = '0' + digits.slice(2)
    return `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
  }

  // Fallback: return as-is
  return phone
}
