'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the login link!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--cc-bg)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1
            className="text-3xl text-[var(--cc-gold)] tracking-wide"
            style={{ fontFamily: "var(--font-heading), 'Cormorant Garamond', serif" }}
          >
            Costi Cohen
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--cc-text-muted)] mt-1.5 font-medium">
            Property Advisory
          </p>
        </div>

        <div className="bg-[var(--cc-surface)] border border-[var(--cc-border)] rounded-xl p-8">
          <h2 className="text-lg font-medium text-[var(--cc-text-primary)] mb-6" style={{ fontFamily: "var(--font-heading), 'Cormorant Garamond', serif" }}>
            Sign in
          </h2>

          <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
            <div className="space-y-5">
              <div>
                <Label className="text-[var(--cc-text-muted)] text-xs uppercase tracking-wider">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1.5 bg-[var(--cc-surface-2)] border-[var(--cc-border)] text-[var(--cc-text-primary)] placeholder:text-[var(--cc-text-faint)]"
                />
              </div>

              {mode === 'password' && (
                <div>
                  <Label className="text-[var(--cc-text-muted)] text-xs uppercase tracking-wider">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="mt-1.5 bg-[var(--cc-surface-2)] border-[var(--cc-border)] text-[var(--cc-text-primary)] placeholder:text-[var(--cc-text-faint)]"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#c9a96e] hover:bg-[#b8924f] text-[#0f0e0c] font-medium"
              >
                {loading ? 'Loading...' : mode === 'password' ? 'Sign In' : 'Send Magic Link'}
              </Button>
            </div>
          </form>

          {message && (
            <p className={`text-sm mt-4 ${message.includes('Check') ? 'text-[var(--cc-gold)]' : 'text-[#a0705a]'}`}>
              {message}
            </p>
          )}

          <button
            onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
            className="text-xs text-[var(--cc-text-muted)] hover:text-[var(--cc-text-secondary)] mt-5 block w-full text-center"
          >
            {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
          </button>
        </div>
      </div>
    </div>
  )
}
