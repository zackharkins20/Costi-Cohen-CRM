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

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and preferences" />

      <div className="space-y-6">
        {/* Profile */}
        <GlassCard hover={false} className="p-6">
          <h3 className="text-sm font-medium text-white mb-5">Profile</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-[#555555] text-[11px] uppercase tracking-[0.08em] font-medium">Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-[#555555] text-[11px] uppercase tracking-[0.08em] font-medium">Email</Label>
              <Input value={form.email} disabled className="mt-1.5 opacity-50" />
            </div>
            <div>
              <Label className="text-[#555555] text-[11px] uppercase tracking-[0.08em] font-medium">Role</Label>
              <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="mt-1.5" />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </GlassCard>

        {/* Theme info */}
        <GlassCard hover={false} className="p-6">
          <h3 className="text-sm font-medium text-white mb-4">Appearance</h3>
          <p className="text-sm text-[#A0A7AB]">
            Dark mode is the default theme for the Costi Cohen Property Advisory CRM.
          </p>
        </GlassCard>
      </div>
    </div>
  )
}
