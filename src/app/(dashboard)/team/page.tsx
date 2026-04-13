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
  Admin: 'bg-transparent text-white border-white',
  Agent: 'bg-transparent text-[#A0A7AB] border-[#333333]',
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

  return (
    <div>
      <PageHeader title="Team" description={`${users.length} team members`}>
        <Button onClick={handleOpenInvite}>
          <Plus className="h-4 w-4 mr-1" /> Invite Team Member
        </Button>
      </PageHeader>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members"
          description="Invite your first team member to get started."
          action={
            <Button onClick={handleOpenInvite}>
              <Plus className="h-4 w-4 mr-1" /> Invite Team Member
            </Button>
          }
        />
      ) : (
        <GlassCard hover={false} className="p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#222222]">
                <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-[#A0A7AB] px-5 py-3">Member</th>
                <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-[#A0A7AB] px-5 py-3">Email</th>
                <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-[#A0A7AB] px-5 py-3">Role</th>
                <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-[#A0A7AB] px-5 py-3">Joined</th>
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
                    className="border-b border-[#111111] last:border-b-0 hover:bg-[#111111] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#111111] border border-[#222222] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.full_name || 'Unnamed'}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] text-[#555555]">(you)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-sm text-[#A0A7AB]">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium border uppercase tracking-[0.04em] ${roleColors[user.role] || roleColors.Agent}`}>
                        {user.role === 'Admin' ? <Shield className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-sm text-[#555555]">
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
        <DialogContent className="bg-[#0a0a0a] border-[#222222] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {successData ? 'Invitation Sent' : 'Invite Team Member'}
            </DialogTitle>
            <DialogDescription className="text-[#A0A7AB]">
              {successData
                ? 'Share these credentials with the new team member.'
                : 'Create an account for a new team member. They can sign in with these credentials.'}
            </DialogDescription>
          </DialogHeader>

          {successData ? (
            <div className="space-y-4 pt-2">
              <div className="bg-[#111111] border border-[#222222] p-4 space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#555555] mb-1">Name</p>
                  <p className="text-sm text-white">{successData.full_name}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#555555] mb-1">Email</p>
                  <p className="text-sm text-white">{successData.email}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#555555] mb-1">Temporary Password</p>
                  <p className="text-sm font-mono text-white">{successData.password}</p>
                </div>
              </div>

              <Button
                onClick={handleCopyCredentials}
                className="w-full"
              >
                {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied ? 'Copied!' : 'Copy Credentials'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {error && (
                <div className="bg-[#111111] border border-[#222222] px-4 py-3">
                  <p className="text-sm text-[#888888]">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[#A0A7AB] text-xs">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#A0A7AB] text-xs">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@costicohen.com.au"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#A0A7AB] text-xs">Role</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Agent')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border text-sm font-medium transition-all ${
                      role === 'Agent'
                        ? 'bg-transparent border-white text-white'
                        : 'bg-transparent border-[#333333] text-[#A0A7AB] hover:text-white hover:border-white'
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                    Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border text-sm font-medium transition-all ${
                      role === 'Admin'
                        ? 'bg-transparent border-white text-white'
                        : 'bg-transparent border-[#333333] text-[#A0A7AB] hover:text-white hover:border-white'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#A0A7AB] text-xs">Temporary Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={tempPassword}
                      onChange={e => setTempPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#555555] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTempPassword(generatePassword())}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleInvite}
                disabled={!fullName || !email || !tempPassword || submitting}
                className="w-full disabled:opacity-50"
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
