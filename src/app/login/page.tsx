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
    <div className="min-h-screen bg-cc-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-cc-text-primary uppercase tracking-[0.15em]">
            Costi Cohen
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-cc-text-secondary mt-1.5 font-normal">
            Property Advisory
          </p>
        </div>

        <div className="bg-cc-surface border border-cc-border p-8">
          <h2 className="text-lg font-semibold text-cc-text-primary mb-6 tracking-[-0.02em]">
            Sign in
          </h2>

          <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
            <div className="space-y-5">
              <div>
                <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1.5 rounded-none"
                />
              </div>

              {mode === 'password' && (
                <div>
                  <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="mt-1.5 rounded-none"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-transparent border-[1.5px] border-cc-btn-border text-cc-btn-text hover:bg-cc-btn-hover-bg hover:text-cc-btn-hover-text"
              >
                {loading ? 'Loading...' : mode === 'password' ? 'Sign In' : 'Send Magic Link'}
              </Button>
            </div>
          </form>

          {message && (
            <p className={`text-sm mt-4 ${message.includes('Check') ? 'text-cc-text-primary' : 'text-cc-destructive'}`}>
              {message}
            </p>
          )}

          <button
            onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
            className="text-xs text-cc-text-muted hover:text-cc-text-secondary mt-5 block w-full text-center"
          >
            {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
          </button>
        </div>
      </div>
    </div>
  )
}
