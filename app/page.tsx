'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/lobby')
      else setChecking(false)
    })
  }, [])

  if (checking) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-[#ff2d55] font-display text-2xl tracking-widest animate-pulse">BARDAPP</div>
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="font-display text-6xl md:text-8xl text-[#ff2d55] tracking-widest mb-2">BARD</h1>
        <h1 className="font-display text-6xl md:text-8xl text-white tracking-widest">APP</h1>
        <p className="text-[#666680] text-sm tracking-widest mt-4 uppercase">El ring del bardeo argentino</p>
      </div>

      {/* Stats animadas */}
      <div className="flex gap-8 mb-12 text-center">
        {[
          { n: '1.2k', label: 'barderos online' },
          { n: '847', label: 'duelos hoy' },
          { n: '∞', label: 'puteadas' },
        ].map(s => (
          <div key={s.label}>
            <div className="font-display text-2xl text-[#ffd60a]">{s.n}</div>
            <div className="text-xs text-[#666680] tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Modos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 w-full max-w-lg">
        {[
          { emoji: '😤', titulo: 'PUTEO YO', desc: 'Te matchea con alguien que aguanta' },
          { emoji: '⚔️', titulo: 'DUELO', desc: 'Los dos bardeamos, vota la gente' },
          { emoji: '😏', titulo: 'ME BARDEAN', desc: 'Aguantás todo lo que te mandan' },
        ].map(m => (
          <div key={m.titulo} className="border border-[#2a2a35] p-4 rounded text-center hover:border-[#ff2d55] transition-colors">
            <div className="text-3xl mb-2">{m.emoji}</div>
            <div className="font-display text-sm text-[#ff2d55] tracking-widest mb-1">{m.titulo}</div>
            <div className="text-xs text-[#666680]">{m.desc}</div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button
          onClick={() => router.push('/auth?mode=register')}
          className="flex-1 bg-[#ff2d55] text-white font-display tracking-widest py-4 rounded hover:bg-[#ff4d6d] transition-colors text-lg"
        >
          ENTRAR AL RING
        </button>
        <button
          onClick={() => router.push('/auth?mode=login')}
          className="flex-1 border border-[#2a2a35] text-[#f0f0f5] font-display tracking-widest py-4 rounded hover:border-[#666680] transition-colors text-lg"
        >
          YA TENGO CUENTA
        </button>
      </div>

      <p className="text-[#444455] text-xs mt-8 max-w-xs">
        Plataforma para bardeo consensuado entre adultos. Cada usuario elige su rol antes de cada duelo.
      </p>
    </div>
  )
}
