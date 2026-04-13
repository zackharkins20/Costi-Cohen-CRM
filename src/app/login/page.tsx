'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: '#F5F5F5' }}>
      {/* Logo */}
      <motion.div
        className="mb-10"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={fadeUp}
      >
        <Image
          src="/logo-text.jpg"
          alt="Costi Cohen"
          width={220}
          height={28}
          className="h-auto"
          priority
        />
      </motion.div>

      {/* Form Card */}
      <motion.div
        className="w-full max-w-[420px] rounded-xl bg-white p-8 sm:p-10"
        style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 10px -5px rgba(0,0,0,0.04)' }}
        initial="hidden"
        animate="visible"
        custom={1}
        variants={fadeUp}
      >
        <h2 className="text-[24px] font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: '#1a1a1a' }}>
          Welcome back
        </h2>
        <p className="mt-1.5 mb-7 text-[14px]" style={{ color: '#4a4a4a' }}>
          Sign in to Costi Cohen
        </p>

        <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: '#333333' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-10 w-full rounded-md border border-[#DDDDDD] bg-[#FAFAFA] px-3 text-sm placeholder:text-[#AAAAAA] outline-none transition-colors focus:border-black focus:ring-2 focus:ring-black/10"
                style={{ color: '#000000' }}
              />
            </div>

            {mode === 'password' && (
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: '#333333' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-10 w-full rounded-md border border-[#DDDDDD] bg-[#FAFAFA] px-3 pr-10 text-sm placeholder:text-[#AAAAAA] outline-none transition-colors focus:border-black focus:ring-2 focus:ring-black/10"
                    style={{ color: '#000000' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#333333] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#000000', color: '#ffffff' }}
            >
              {loading ? 'Loading...' : mode === 'password' ? 'Sign In' : 'Send Magic Link'}
            </button>
          </div>
        </form>

        {message && (
          <p className="text-sm mt-4" style={{ color: message.includes('Check') ? '#1a1a1a' : '#dc2626' }}>
            {message}
          </p>
        )}

        <button
          onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
          className="text-xs mt-5 block w-full text-center transition-colors hover:opacity-80"
          style={{ color: '#666666' }}
        >
          {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
        </button>
      </motion.div>

      {/* Footer */}
      <motion.p
        className="mt-8 text-[13px]"
        style={{ color: '#888888' }}
        initial="hidden"
        animate="visible"
        custom={2}
        variants={fadeUp}
      >
        Costi Cohen &copy; 2026
      </motion.p>
    </div>
  )
}
