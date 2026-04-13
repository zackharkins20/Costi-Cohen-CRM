'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCurrentUser, updateUser } from '@/lib/queries'
import type { User } from '@/lib/types'

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', role: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  const inputClass = 'bg-[var(--cc-surface-2)] border-[var(--cc-border)] text-[var(--cc-text-primary)] placeholder:text-[var(--cc-text-faint)]'

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and preferences" />

      <div className="space-y-6">
        {/* Profile */}
        <GlassCard hover={false} className="p-6">
          <h3 className="text-sm font-medium text-[var(--cc-text-primary)] mb-5">Profile</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-[var(--cc-text-muted)] text-xs uppercase tracking-wider">Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={`mt-1.5 ${inputClass}`} />
            </div>
            <div>
              <Label className="text-[var(--cc-text-muted)] text-xs uppercase tracking-wider">Email</Label>
              <Input value={form.email} disabled className={`mt-1.5 ${inputClass} opacity-50`} />
            </div>
            <div>
              <Label className="text-[var(--cc-text-muted)] text-xs uppercase tracking-wider">Role</Label>
              <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={`mt-1.5 ${inputClass}`} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-[var(--cc-gold)] hover:bg-[var(--cc-gold-hover)] text-[#0f0e0c]">
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </GlassCard>

        {/* Theme info */}
        <GlassCard hover={false} className="p-6">
          <h3 className="text-sm font-medium text-[var(--cc-text-primary)] mb-4">Appearance</h3>
          <p className="text-sm text-[var(--cc-text-tertiary)]">
            Dark mode is the default theme for the Costi Cohen Property Advisory CRM.
          </p>
        </GlassCard>
      </div>
    </div>
  )
}
