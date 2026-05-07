'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const AVATARS = ['😤','😈','🔥','💀','⚡','🤌','😏','🥊','🎯','👿']

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'login'
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('😤')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, avatar_emoji: avatar }
        }
      })
      if (error) { setError(error.message); setLoading(false); return }
      router.replace('/lobby')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Email o contraseña incorrectos'); setLoading(false); return }
      router.replace('/lobby')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => router.push('/')} className="font-display text-3xl text-[#ff2d55] tracking-widest hover:opacity-80 transition-opacity">
            BARDAPP
          </button>
          <p className="text-[#666680] text-xs tracking-widest mt-2">
            {mode === 'register' ? 'CREAR CUENTA' : 'INICIAR SESIÓN'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username + Avatar (solo registro) */}
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs text-[#666680] tracking-widest uppercase block mb-2">Tu apodo de bardero</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="CrackRodrigo99"
                  required
                  minLength={3}
                  maxLength={20}
                  className="w-full bg-[#141418] border border-[#2a2a35] text-white font-mono px-4 py-3 rounded focus:border-[#ff2d55] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-[#666680] tracking-widest uppercase block mb-2">Tu avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`text-2xl w-12 h-12 rounded border transition-all ${avatar === a ? 'border-[#ff2d55] bg-[#2d0a12]' : 'border-[#2a2a35] bg-[#141418] hover:border-[#666680]'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-[#666680] tracking-widest uppercase block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vos@mail.com"
              required
              className="w-full bg-[#141418] border border-[#2a2a35] text-white font-mono px-4 py-3 rounded focus:border-[#ff2d55] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-[#666680] tracking-widest uppercase block mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full bg-[#141418] border border-[#2a2a35] text-white font-mono px-4 py-3 rounded focus:border-[#ff2d55] outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="bg-[#2d0a12] border border-[#ff2d55] text-[#ff8099] text-sm px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff2d55] text-white font-display tracking-widest py-4 rounded hover:bg-[#ff4d6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? 'CARGANDO...' : mode === 'register' ? 'CREAR CUENTA' : 'ENTRAR'}
          </button>
        </form>

        <p className="text-center text-[#666680] text-sm mt-6">
          {mode === 'register' ? (
            <>¿Ya tenés cuenta? <button onClick={() => router.push('/auth?mode=login')} className="text-[#ff2d55] hover:underline">Entrá acá</button></>
          ) : (
            <>¿No tenés cuenta? <button onClick={() => router.push('/auth?mode=register')} className="text-[#ff2d55] hover:underline">Registrate</button></>
          )}
        </p>
      </div>
    </div>
  )
}
