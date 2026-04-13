'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

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
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Panel — Brand Hero (always black) */}
      <div className="relative flex w-full flex-col justify-between bg-black px-10 py-10 lg:w-1/2 lg:px-16 lg:py-14 min-h-[280px] lg:min-h-screen">
        {/* Subtle noise overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />

        {/* Top — Logo */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
        >
          <span className="text-[16px] font-semibold uppercase tracking-[0.15em] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            COSTI COHEN
          </span>
        </motion.div>

        {/* Center — Headline */}
        <div className="flex flex-1 flex-col justify-center py-10 lg:py-0">
          <motion.h1
            className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[42px] lg:text-[48px]"
            style={{ fontFamily: "'Inter', sans-serif" }}
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
          >
            Commercial Property<br />Intelligence
          </motion.h1>

          <motion.div
            className="my-6 h-[1.5px] w-[60px] bg-white"
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
          />

          <motion.p
            className="text-[18px] font-normal text-[#A0A7AB]"
            style={{ fontFamily: "'Inter', sans-serif" }}
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
          >
            Excellence in every acquisition.
          </motion.p>

          <motion.p
            className="mt-2 text-[15px] font-normal text-[#A0A7AB]"
            style={{ fontFamily: "'Inter', sans-serif" }}
            initial="hidden"
            animate="visible"
            custom={4}
            variants={fadeUp}
          >
            Your property advisory command centre.
          </motion.p>
        </div>

        {/* Bottom — Footer */}
        <motion.div
          className="flex items-center gap-4 text-[13px] text-[#555555]"
          initial="hidden"
          animate="visible"
          custom={5}
          variants={fadeUp}
        >
          <span>costicohen.com.au</span>
          <span>&copy; 2026 Costi Cohen</span>
        </motion.div>
      </div>

      {/* Right Panel — Login Form (theme-aware) */}
      <div className="flex w-full flex-1 flex-col items-center justify-center bg-cc-bg px-6 py-12 lg:w-1/2 lg:px-16">
        <motion.div
          className="w-full max-w-[400px]"
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
        >
          {/* Heading */}
          <h2
            className="text-[28px] font-semibold text-cc-text-primary"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Welcome back
          </h2>
          <p className="mt-2 mb-8 text-[15px] text-[#A0A7AB]">
            Sign in to Costi Cohen
          </p>

          {/* Form Card */}
          <div className="rounded-xl border border-cc-border bg-cc-surface p-8 sm:p-10">
            <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
              <div className="space-y-5">
                <div>
                  <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="mt-1.5"
                  />
                </div>

                {mode === 'password' && (
                  <div>
                    <Label className="text-cc-text-muted text-[11px] uppercase tracking-[0.08em] font-medium">
                      Password
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cc-text-muted hover:text-cc-text-secondary transition-colors"
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
              className="text-xs text-cc-text-muted hover:text-cc-text-secondary mt-5 block w-full text-center transition-colors"
            >
              {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
            </button>
          </div>

          {/* Bottom footer */}
          <p className="mt-8 text-center text-[13px] text-cc-text-muted">
            Costi Cohen &copy; 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}
