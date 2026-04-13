'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { getUsers, getCurrentUser } from '@/lib/queries'
import type { User } from '@/lib/types'
import { Users, Plus, Shield, UserCheck, Mail, Calendar, RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'

function generatePassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `CC-${result}`
}

const roleColors: Record<string, string> = {
  Admin: 'bg-[#3a3228]/60 text-[#c9a96e] border-[#3a3228]',
  Agent: 'bg-[#2e3228]/60 text-[#8a9a70] border-[#2e3228]',
}

export default function TeamPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState<{ email: string; password: string; full_name: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'Agent' | 'Admin'>('Agent')
  const [tempPassword, setTempPassword] = useState(() => generatePassword())

  const load = async () => {
    setLoading(true)
    const [fetchedUsers, user] = await Promise.all([getUsers(), getCurrentUser()])
    setUsers(fetchedUsers)
    setCurrentUser(user)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Redirect non-admins
  useEffect(() => {
    if (!loading && currentUser && currentUser.role !== 'Admin') {
      router.push('/')
    }
  }, [loading, currentUser, router])

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setRole('Agent')
    setTempPassword(generatePassword())
    setError('')
    setSuccessData(null)
    setShowPassword(false)
  }

  const handleOpenInvite = () => {
    resetForm()
    setInviteOpen(true)
  }

  const handleCloseInvite = () => {
    setInviteOpen(false)
    if (successData) {
      load()
    }
  }

  const handleInvite = async () => {
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName,
          role,
          temporary_password: tempPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to invite user')
        return
      }

      setSuccessData({ email, password: tempPassword, full_name: fullName })
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyCredentials = async () => {
    if (!successData) return
    await navigator.clipboard.writeText(
      `Email: ${successData.email}\nTemporary Password: ${successData.password}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Don't render until we know the user is Admin
  if (loading || !currentUser || currentUser.role !== 'Admin') {
    return null
  }

  const inputClass = 'bg-[var(--cc-surface-2)] border-[var(--cc-border)] text-[var(--cc-text-primary)] placeholder:text-[var(--cc-text-muted)] focus:border-[var(--cc-gold)] focus:ring-1 focus:ring-[var(--cc-gold)]/30'

  return (
    <div>
      <PageHeader title="Team" description={`${users.length} team members`}>
        <Button
          onClick={handleOpenInvite}
          className="bg-[var(--cc-gold)] hover:bg-[var(--cc-gold-hover)] text-[#0f0e0c]"
        >
          <Plus className="h-4 w-4 mr-1" /> Invite Team Member
        </Button>
      </PageHeader>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members"
          description="Invite your first team member to get started."
          action={
            <Button
              onClick={handleOpenInvite}
              className="bg-[var(--cc-gold)] hover:bg-[var(--cc-gold-hover)] text-[#0f0e0c]"
            >
              <Plus className="h-4 w-4 mr-1" /> Invite Team Member
            </Button>
          }
        />
      ) : (
        <GlassCard hover={false} className="p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--cc-border)]">
                <th className="text-left text-[10px] uppercase tracking-[0.1em] font-semibold text-[var(--cc-text-muted)] px-5 py-3">Member</th>
                <th className="text-left text-[10px] uppercase tracking-[0.1em] font-semibold text-[var(--cc-text-muted)] px-5 py-3">Email</th>
                <th className="text-left text-[10px] uppercase tracking-[0.1em] font-semibold text-[var(--cc-text-muted)] px-5 py-3">Role</th>
                <th className="text-left text-[10px] uppercase tracking-[0.1em] font-semibold text-[var(--cc-text-muted)] px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const initials = (user.full_name || user.email)
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
                const isCurrentUser = user.id === currentUser.id

                return (
                  <tr
                    key={user.id}
                    className="border-b border-[var(--cc-border)] last:border-b-0 hover:bg-[var(--cc-surface-offset)] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--cc-gold-soft)] flex items-center justify-center text-[var(--cc-gold)] font-semibold text-xs flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--cc-text-primary)]">
                            {user.full_name || 'Unnamed'}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] text-[var(--cc-text-muted)]">(you)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-sm text-[var(--cc-text-tertiary)]">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[user.role] || roleColors.Agent}`}>
                        {user.role === 'Admin' ? <Shield className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-sm text-[var(--cc-text-muted)]">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(user.created_at), 'd MMM yyyy')}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* Invite Team Member Modal */}
      <Dialog open={inviteOpen} onOpenChange={handleCloseInvite}>
        <DialogContent className="bg-[var(--cc-surface)] border-[var(--cc-border)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--cc-text-primary)]">
              {successData ? 'Invitation Sent' : 'Invite Team Member'}
            </DialogTitle>
            <DialogDescription className="text-[var(--cc-text-tertiary)]">
              {successData
                ? 'Share these credentials with the new team member.'
                : 'Create an account for a new team member. They can sign in with these credentials.'}
            </DialogDescription>
          </DialogHeader>

          {successData ? (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-[#2e3228]/40 border border-[#2e3228] p-4 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--cc-text-muted)] mb-1">Name</p>
                  <p className="text-sm text-[var(--cc-text-primary)]">{successData.full_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--cc-text-muted)] mb-1">Email</p>
                  <p className="text-sm text-[var(--cc-text-primary)]">{successData.email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--cc-text-muted)] mb-1">Temporary Password</p>
                  <p className="text-sm font-mono text-[var(--cc-gold)]">{successData.password}</p>
                </div>
              </div>

              <Button
                onClick={handleCopyCredentials}
                className="w-full bg-[var(--cc-gold)] hover:bg-[var(--cc-gold-hover)] text-[#0f0e0c]"
              >
                {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied ? 'Copied!' : 'Copy Credentials'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {error && (
                <div className="rounded-lg bg-[#3a2828]/40 border border-[#3a2828] px-4 py-3">
                  <p className="text-sm text-[#a0705a]">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[var(--cc-text-tertiary)] text-xs">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--cc-text-tertiary)] text-xs">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@costicohen.com.au"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--cc-text-tertiary)] text-xs">Role</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Agent')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      role === 'Agent'
                        ? 'bg-[var(--cc-gold-soft)] border-[var(--cc-gold)] text-[var(--cc-gold)]'
                        : 'bg-[var(--cc-surface-2)] border-[var(--cc-border)] text-[var(--cc-text-tertiary)] hover:text-[var(--cc-text-primary)]'
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                    Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      role === 'Admin'
                        ? 'bg-[var(--cc-gold-soft)] border-[var(--cc-gold)] text-[var(--cc-gold)]'
                        : 'bg-[var(--cc-surface-2)] border-[var(--cc-border)] text-[var(--cc-text-tertiary)] hover:text-[var(--cc-text-primary)]'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--cc-text-tertiary)] text-xs">Temporary Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={tempPassword}
                      onChange={e => setTempPassword(e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--cc-text-muted)] hover:text-[var(--cc-text-primary)]"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTempPassword(generatePassword())}
                    className="border-[var(--cc-border)] text-[var(--cc-text-tertiary)] hover:text-[var(--cc-gold)] hover:border-[var(--cc-gold)]"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleInvite}
                disabled={!fullName || !email || !tempPassword || submitting}
                className="w-full bg-[var(--cc-gold)] hover:bg-[var(--cc-gold-hover)] text-[#0f0e0c] disabled:opacity-50"
              >
                {submitting ? 'Creating Account...' : 'Create Account & Invite'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
