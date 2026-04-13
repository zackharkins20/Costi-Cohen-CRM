'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { EyeIcon, EyeOffIcon, Building2, Users, Zap } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [btnHover, setBtnHover] = useState(false)
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

  const features = [
    { icon: Building2, title: 'Pipeline Management', desc: 'Track deals from lead to settlement' },
    { icon: Users, title: 'Client Intelligence', desc: 'Contacts, history, and insights' },
    { icon: Zap, title: 'Workflow Automation', desc: 'Set it and forget it' },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: '#F5F5F5' }}>
      {/* ─── Left Panel: Branded Splash ─── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a1a1a 0%, #2A3A4D 100%)' }}
      >
        {/* Logo */}
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
          <span
            style={{
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0.18em',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            COSTI COHEN
          </span>
        </motion.div>

        {/* Main content */}
        <div>
          <motion.h1
            className="text-[56px] font-bold leading-[1.05] tracking-[-0.02em]"
            style={{ color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
          >
            The Exchange
          </motion.h1>

          <motion.div
            className="h-[3px] mt-5 mb-5"
            style={{ background: '#5A7A94', width: '60px' }}
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
          />

          <motion.p
            className="text-[20px] font-light"
            style={{ color: '#B8C4D0', fontFamily: "'Inter', sans-serif" }}
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
          >
            Where deals change hands.
          </motion.p>

          {/* Feature cards */}
          <div className="mt-10 space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="flex items-center gap-4 rounded-lg px-5 py-4"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                }}
                initial="hidden"
                animate="visible"
                custom={4 + i}
                variants={fadeUp}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ background: 'rgba(59, 80, 104, 0.4)', border: '1px solid rgba(59, 80, 104, 0.3)' }}
                >
                  <f.icon className="w-5 h-5" style={{ color: '#D8DEE4' }} />
                </div>
                <div>
                  <p className="text-[14px] font-medium" style={{ color: '#FFFFFF' }}>{f.title}</p>
                  <p className="text-[12px]" style={{ color: '#B8C4D0' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          className="flex items-center justify-between"
          initial="hidden"
          animate="visible"
          custom={7}
          variants={fadeUp}
        >
          <span className="text-[12px]" style={{ color: '#6B7C93' }}>
            costicohen.com.au
          </span>
          <span className="text-[12px]" style={{ color: '#6B7C93' }}>
            &copy; 2026 Costi Cohen
          </span>
        </motion.div>
      </div>

      {/* ─── Right Panel: Login Form ─── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 lg:w-1/2" style={{ background: '#F5F5F5' }}>
        {/* Mobile-only logo */}
        <motion.div
          className="mb-8 lg:hidden"
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
        >
          <span
            style={{
              color: '#1a1a1a',
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            The Exchange
          </span>
        </motion.div>

        <motion.div
          className="w-full max-w-[420px]"
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
        >
          <h2 className="text-[28px] font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: '#1a1a1a' }}>
            Welcome back
          </h2>
          <p className="mt-1.5 mb-8 text-[14px]" style={{ color: '#555555' }}>
            Sign in to The Exchange
          </p>

          <div
            className="rounded-xl bg-white p-8"
            style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 10px -5px rgba(0,0,0,0.04)' }}
          >
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
                    className="h-10 w-full rounded-md border border-[#DDDDDD] bg-[#FAFAFA] px-3 text-sm placeholder:text-[#AAAAAA] outline-none transition-colors focus:border-[#3B5068] focus:ring-2 focus:ring-[#3B5068]/20"
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
                        className="h-10 w-full rounded-md border border-[#DDDDDD] bg-[#FAFAFA] px-3 pr-10 text-sm placeholder:text-[#AAAAAA] outline-none transition-colors focus:border-[#3B5068] focus:ring-2 focus:ring-[#3B5068]/20"
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
                  onMouseEnter={() => setBtnHover(true)}
                  onMouseLeave={() => setBtnHover(false)}
                  className="w-full h-10 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: btnHover ? '#222222' : '#000000', color: '#ffffff' }}
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
              style={{ color: '#3B5068' }}
            >
              {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
            </button>
          </div>
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
    </div>
  )
}
