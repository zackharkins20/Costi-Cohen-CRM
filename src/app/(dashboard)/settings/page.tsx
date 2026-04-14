'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCurrentUser, updateUser } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/theme-provider'
import { WhatsNewModal } from '@/components/whats-new-modal'
import { FeatureTour, useTour } from '@/components/feature-tour'
import { Sparkles, Compass, Lock, Bell } from 'lucide-react'
import type { User } from '@/lib/types'

const NOTIF_PREFS_KEY = 'exchange_notification_prefs'

interface NotificationPrefs {
  deal_stage_changes: boolean
  task_assignments: boolean
  new_contacts: boolean
  automation_triggers: boolean
  new_team_member: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  deal_stage_changes: true,
  task_assignments: true,
  new_contacts: true,
  automation_triggers: true,
  new_team_member: true,
}

function loadNotifPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY)
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_PREFS }
}

function saveNotifPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs))
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', role: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { tourActive, startTourManual, completeTour } = useTour()

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Notification prefs state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)

  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) {
        setUser(u)
        setForm({ full_name: u.full_name, email: u.email, role: u.role })
      }
    })
    setNotifPrefs(loadNotifPrefs())
  }, [])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await updateUser(user.id, { full_name: form.full_name, role: form.role })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePasswordUpdate = async () => {
    setPwMessage(null)
    if (newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'New password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    setPwSaving(true)
    try {
      const supabase = createClient()
      // Re-authenticate with current password to verify identity
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: currentPassword,
      })
      if (signInError) {
        setPwMessage({ type: 'error', text: 'Current password is incorrect.' })
        setPwSaving(false)
        return
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPwMessage({ type: 'error', text: error.message })
      } else {
        setPwMessage({ type: 'success', text: 'Password updated successfully.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setPwMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setPwSaving(false)
    }
  }

  const toggleNotifPref = (key: keyof NotificationPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(updated)
    saveNotifPrefs(updated)
  }

  const notifOptions: { key: keyof NotificationPrefs; label: string }[] = [
    { key: 'deal_stage_changes', label: 'Deal stage changes' },
    { key: 'task_assignments', label: 'Task assignments' },
    { key: 'new_contacts', label: 'New contacts added' },
    { key: 'automation_triggers', label: 'Automation triggers' },
    { key: 'new_team_member', label: 'New team member joined' },
  ]

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and preferences" />

      <div className="space-y-6">
        {/* Profile */}
        <GlassCard hover={false} className="p-6">
          <h3 className="text-sm font-medium text-cc-text-primary mb-5">Profile</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Email</Label>
              <Input value={form.email} disabled className="mt-1.5 opacity-50" />
            </div>
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Role</Label>
              <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="mt-1.5" />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </GlassCard>

        {/* Security — Password Change */}
        <GlassCard hover={false} className="p-6">
          <h3 className="text-sm font-medium text-cc-text-primary mb-5 flex items-center gap-2">
            <Lock className="h-4 w-4" /> Security
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="mt-1.5"
              />
            </div>
            {pwMessage && (
              <p className={`text-sm ${pwMessage.type === 'success' ? 'text-green-500' : 'text-cc-destructive'}`}>
                {pwMessage.text}
              </p>
            )}
            <Button onClick={handlePasswordUpdate} disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}>
              {pwSaving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </GlassCard>

        {/* Notifications */}
        <GlassCard hover={false} className="p-6">
          <h3 className="text-sm font-medium text-cc-text-primary mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </h3>
          <p className="text-sm text-cc-text-secondary mb-4">
            Choose which notifications you&apos;d like to receive.
          </p>
          <div className="space-y-3">
            {notifOptions.map(opt => (
              <label key={opt.key} className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-cc-text-secondary group-hover:text-cc-text-primary transition-colors">{opt.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifPrefs[opt.key]}
                  onClick={() => toggleNotifPref(opt.key)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    notifPrefs[opt.key] ? 'bg-[#3B5068]' : 'bg-cc-surface-2 border border-cc-border'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      notifPrefs[opt.key] ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </GlassCard>

        {/* Appearance */}
        <GlassCard hover={false} className="p-6">
          <h3 className="text-sm font-medium text-cc-text-primary mb-4">Appearance</h3>
          <p className="text-sm text-cc-text-secondary mb-4">
            Toggle between dark and light mode.
          </p>
          <Button variant="outline" onClick={toggleTheme}>
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </Button>
        </GlassCard>

        {/* Help & Onboarding */}
        <GlassCard hover={false} className="p-6">
          <h3 className="text-sm font-medium text-cc-text-primary mb-4">Help & Onboarding</h3>
          <p className="text-sm text-cc-text-secondary mb-4">
            View the latest changes or take a guided tour of the CRM.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setWhatsNewOpen(true)}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              What&apos;s New
            </Button>
            <Button variant="outline" onClick={startTourManual}>
              <Compass className="h-4 w-4 mr-1.5" />
              Take a Tour
            </Button>
          </div>
        </GlassCard>
      </div>

      <WhatsNewModal open={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
      <FeatureTour active={tourActive} onComplete={completeTour} />
    </div>
  )
}
