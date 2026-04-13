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
      </div>
    </div>
  )
}
