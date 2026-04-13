'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCurrentUser, updateUser } from '@/lib/queries'
import { useTheme } from '@/components/theme-provider'
import type { User } from '@/lib/types'
import { Sun, Moon } from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', role: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) {
        setUser(u)
        setForm({ full_name: u.full_name, email: u.email, role: u.role })
      }
    })
  }, [])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await updateUser(user.id, { full_name: form.full_name, role: form.role })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputClass = 'bg-[var(--cc-glass-bg)] border-[var(--cc-glass-border)] text-[var(--cc-text-primary)]'

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and preferences" />

      <div className="space-y-6">
        {/* Profile */}
        <GlassCard hover={false} className="p-5">
          <h3 className="text-sm font-medium text-[var(--cc-text-primary)] mb-4">Profile</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-[var(--cc-text-secondary)] text-xs">Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={`mt-1 ${inputClass}`} />
            </div>
            <div>
              <Label className="text-[var(--cc-text-secondary)] text-xs">Email</Label>
              <Input value={form.email} disabled className={`mt-1 ${inputClass} opacity-50`} />
            </div>
            <div>
              <Label className="text-[var(--cc-text-secondary)] text-xs">Role</Label>
              <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={`mt-1 ${inputClass}`} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-[var(--cc-accent)] hover:bg-[var(--cc-accent)]/90 text-white">
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </GlassCard>

        {/* Theme */}
        <GlassCard hover={false} className="p-5">
          <h3 className="text-sm font-medium text-[var(--cc-text-primary)] mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--cc-text-secondary)]">Theme</p>
              <p className="text-xs text-[var(--cc-text-muted)]">Switch between dark and light mode</p>
            </div>
            <Button
              variant="outline"
              onClick={toggleTheme}
              className="border-[var(--cc-glass-border)] text-[var(--cc-text-secondary)]"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
