'use client'

import { useEffect, useState, useRef } from 'react'
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
import { getUsers, getCurrentUser, updateUser } from '@/lib/queries'
import type { User } from '@/lib/types'
import { Users, Plus, Shield, UserCheck, Mail, Calendar, RefreshCw, Copy, Check, Eye, EyeOff, MoreHorizontal, Pencil, UserX, Trash2, Ban } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'

function generatePassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `CC-${result}`
}

const roleColors: Record<string, string> = {
  Admin: 'bg-transparent text-cc-text-primary border-cc-btn-border',
  Agent: 'bg-transparent text-cc-text-secondary border-cc-border-hover',
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

  // Action menu state
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Edit role state
  const [editRoleUser, setEditRoleUser] = useState<User | null>(null)
  const [editRoleValue, setEditRoleValue] = useState<'Agent' | 'Admin'>('Agent')

  // Deactivate state
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null)

  // Remove state
  const [removeUser, setRemoveUser] = useState<User | null>(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'Agent' | 'Admin'>('Agent')
  const [tempPassword, setTempPassword] = useState(() => generatePassword())

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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

  const handleEditRole = (user: User) => {
    setEditRoleUser(user)
    setEditRoleValue(user.role as 'Agent' | 'Admin')
    setMenuOpenId(null)
  }

  const handleSaveRole = async () => {
    if (!editRoleUser) return
    await updateUser(editRoleUser.id, { role: editRoleValue })
    setEditRoleUser(null)
    load()
  }

  const handleDeactivate = (user: User) => {
    setDeactivateUser(user)
    setMenuOpenId(null)
  }

  const handleConfirmDeactivate = async () => {
    if (!deactivateUser) return
    const newRole = deactivateUser.role === 'Deactivated' ? 'Agent' : 'Deactivated'
    await updateUser(deactivateUser.id, { role: newRole })
    setDeactivateUser(null)
    load()
  }

  const handleRemove = (user: User) => {
    setRemoveUser(user)
    setMenuOpenId(null)
  }

  const handleConfirmRemove = async () => {
    if (!removeUser) return
    const supabase = createClient()
    await supabase.from('users').delete().eq('id', removeUser.id)
    setRemoveUser(null)
    load()
  }

  const activeUsers = users.filter(u => u.role !== 'Deactivated')
  const deactivatedUsers = users.filter(u => u.role === 'Deactivated')

  // Don't render until we know the user is Admin
  if (loading || !currentUser || currentUser.role !== 'Admin') {
    return null
  }

  return (
    <div>
      <PageHeader title="Team" description={`${activeUsers.length} active member${activeUsers.length !== 1 ? 's' : ''}${deactivatedUsers.length > 0 ? ` · ${deactivatedUsers.length} deactivated` : ''}`}>
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
              <tr className="border-b border-cc-border">
                <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-cc-text-secondary px-5 py-3">Member</th>
                <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-cc-text-secondary px-5 py-3">Email</th>
                <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-cc-text-secondary px-5 py-3">Role</th>
                <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-cc-text-secondary px-5 py-3">Joined</th>
                <th className="text-right text-[11px] uppercase tracking-[0.08em] font-medium text-cc-text-secondary px-5 py-3">Actions</th>
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
                const isDeactivated = user.role === 'Deactivated'

                return (
                  <tr
                    key={user.id}
                    className={`border-b border-cc-surface-2 last:border-b-0 hover:bg-cc-surface-2 transition-colors ${isDeactivated ? 'opacity-50' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-cc-surface-2 border border-cc-border flex items-center justify-center text-cc-text-primary font-semibold text-xs flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-cc-text-primary">
                            {user.full_name || 'Unnamed'}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] text-cc-text-muted">(you)</span>
                            )}
                          </p>
                          {isDeactivated && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-cc-surface-2 border border-cc-border text-cc-text-muted mt-0.5">
                              <Ban className="h-2.5 w-2.5" /> Deactivated
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-sm text-cc-text-secondary">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium border uppercase tracking-[0.04em] ${roleColors[user.role] || roleColors.Agent}`}>
                        {user.role === 'Admin' ? <Shield className="h-3 w-3" /> : isDeactivated ? <Ban className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-sm text-cc-text-muted">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(user.created_at), 'd MMM yyyy')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!isCurrentUser && (
                        <div className="relative inline-block" ref={menuOpenId === user.id ? menuRef : undefined}>
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === user.id ? null : user.id)}
                            className="p-1.5 rounded-lg hover:bg-cc-surface-2 text-cc-text-muted hover:text-cc-text-primary transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menuOpenId === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-cc-surface border border-cc-border rounded-lg shadow-lg z-50 py-1">
                              {!isDeactivated && (
                                <button
                                  onClick={() => handleEditRole(user)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cc-text-secondary hover:bg-cc-surface-2 hover:text-cc-text-primary transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Edit Role
                                </button>
                              )}
                              <button
                                onClick={() => handleDeactivate(user)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cc-text-secondary hover:bg-cc-surface-2 hover:text-cc-text-primary transition-colors"
                              >
                                <UserX className="h-3.5 w-3.5" /> {isDeactivated ? 'Reactivate' : 'Deactivate'}
                              </button>
                              {currentUser.role === 'Admin' && (
                                <button
                                  onClick={() => handleRemove(user)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cc-destructive hover:bg-cc-surface-2 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Remove
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {successData ? 'Invitation Sent' : 'Invite Team Member'}
            </DialogTitle>
            <DialogDescription>
              {successData
                ? 'Share these credentials with the new team member.'
                : 'Create an account for a new team member. They can sign in with these credentials.'}
            </DialogDescription>
          </DialogHeader>

          {successData ? (
            <div className="space-y-4 pt-2">
              <div className="bg-cc-surface-2 border border-cc-border p-4 space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-cc-text-muted mb-1">Name</p>
                  <p className="text-sm text-cc-text-primary">{successData.full_name}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-cc-text-muted mb-1">Email</p>
                  <p className="text-sm text-cc-text-primary">{successData.email}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-cc-text-muted mb-1">Temporary Password</p>
                  <p className="text-sm font-mono text-cc-text-primary">{successData.password}</p>
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
                <div className="bg-cc-surface-2 border border-cc-border px-4 py-3">
                  <p className="text-sm text-cc-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-cc-text-secondary text-xs">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-cc-text-secondary text-xs">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@costicohen.com.au"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-cc-text-secondary text-xs">Role</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Agent')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border text-sm font-medium transition-all ${
                      role === 'Agent'
                        ? 'bg-transparent border-cc-btn-border text-cc-text-primary'
                        : 'bg-transparent border-cc-border-hover text-cc-text-secondary hover:text-cc-text-primary hover:border-cc-btn-border'
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
                        ? 'bg-transparent border-cc-btn-border text-cc-text-primary'
                        : 'bg-transparent border-cc-border-hover text-cc-text-secondary hover:text-cc-text-primary hover:border-cc-btn-border'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-cc-text-secondary text-xs">Temporary Password</Label>
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-cc-text-muted hover:text-cc-text-primary"
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
      {/* Edit Role Dialog */}
      <Dialog open={!!editRoleUser} onOpenChange={() => setEditRoleUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Change the role for {editRoleUser?.full_name || editRoleUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditRoleValue('Agent')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border text-sm font-medium transition-all ${
                  editRoleValue === 'Agent'
                    ? 'bg-transparent border-cc-btn-border text-cc-text-primary'
                    : 'bg-transparent border-cc-border-hover text-cc-text-secondary hover:text-cc-text-primary hover:border-cc-btn-border'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                Agent
              </button>
              <button
                type="button"
                onClick={() => setEditRoleValue('Admin')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border text-sm font-medium transition-all ${
                  editRoleValue === 'Admin'
                    ? 'bg-transparent border-cc-btn-border text-cc-text-primary'
                    : 'bg-transparent border-cc-border-hover text-cc-text-secondary hover:text-cc-text-primary hover:border-cc-btn-border'
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditRoleUser(null)}>Cancel</Button>
              <Button onClick={handleSaveRole}>Save Role</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={!!deactivateUser} onOpenChange={() => setDeactivateUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{deactivateUser?.role === 'Deactivated' ? 'Reactivate' : 'Deactivate'} Member</DialogTitle>
            <DialogDescription>
              {deactivateUser?.role === 'Deactivated'
                ? `Are you sure you want to reactivate ${deactivateUser?.full_name || deactivateUser?.email}? They will be able to log in again.`
                : `Are you sure you want to deactivate ${deactivateUser?.full_name || deactivateUser?.email}? They will no longer be able to access the system.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeactivateUser(null)}>Cancel</Button>
            <Button variant={deactivateUser?.role === 'Deactivated' ? 'default' : 'destructive'} onClick={handleConfirmDeactivate}>
              {deactivateUser?.role === 'Deactivated' ? 'Reactivate' : 'Deactivate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={!!removeUser} onOpenChange={() => setRemoveUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently remove {removeUser?.full_name || removeUser?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setRemoveUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmRemove}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
