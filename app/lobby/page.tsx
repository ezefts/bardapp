'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type Profile, type Duelo } from '@/lib/supabase'

export default function LobbyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [duelosVivos, setDuelosVivos] = useState<Duelo[]>([])
  const [modo, setModo] = useState<'duelo' | 'puteo' | 'recibo'>('duelo')
  const [buscando, setBuscando] = useState(false)
  const [enCola, setEnCola] = useState(false)
  const [tiempoEspera, setTiempoEspera] = useState(0)

  useEffect(() => {
    loadData()
    const channel = supabase
      .channel('matchmaking')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'duelos' }, handleNewDuelo)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Timer de espera
  useEffect(() => {
    let iv: ReturnType<typeof setInterval>
    if (enCola) {
      iv = setInterval(() => setTiempoEspera(t => t + 1), 1000)
    } else {
      setTiempoEspera(0)
    }
    return () => clearInterval(iv)
  }, [enCola])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    const { data: duelos } = await supabase
      .from('duelos')
      .select('*, jugador1:profiles!jugador1_id(*), jugador2:profiles!jugador2_id(*)')
      .eq('estado', 'en_curso')
      .order('espectadores', { ascending: false })
      .limit(5)
    setDuelosVivos(duelos || [])
  }

  async function handleNewDuelo(payload: any) {
    const duelo = payload.new
    const { data: { user } } = await supabase.auth.getUser()
    if (duelo.jugador1_id === user?.id || duelo.jugador2_id === user?.id) {
      router.push(`/duelo/${duelo.id}`)
    }
  }

  async function buscarMatch() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setBuscando(true)

    // Buscar alguien en la cola con modo compatible
    const modoCompatible = modo === 'puteo' ? 'recibo' : modo === 'recibo' ? 'puteo' : 'duelo'
    const { data: candidatos } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('modo', modoCompatible)
      .neq('user_id', user.id)
      .order('created_at')
      .limit(1)

    if (candidatos && candidatos.length > 0) {
      // Match encontrado! Crear duelo
      const rival = candidatos[0]
      await supabase.from('matchmaking_queue').delete().eq('user_id', rival.user_id)

      const { data: duelo } = await supabase
        .from('duelos')
        .insert({
          jugador1_id: user.id,
          jugador2_id: rival.user_id,
          estado: 'en_curso',
        })
        .select()
        .single()

      if (duelo) router.push(`/duelo/${duelo.id}`)
    } else {
      // Entrar a la cola y esperar
      await supabase.from('matchmaking_queue').upsert({ user_id: user.id, modo })
      setEnCola(true)
      setBuscando(false)
    }
  }

  async function salirDeCola() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('matchmaking_queue').delete().eq('user_id', user.id)
    setEnCola(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const modoInfo = {
    duelo: { emoji: '⚔️', label: 'DUELO', desc: 'Los dos bardeamos, vota la gente' },
    puteo: { emoji: '😤', label: 'PUTEO YO', desc: 'Vos puteas, el otro aguanta' },
    recibo: { emoji: '😏', label: 'ME BARDEAN', desc: 'Aguantás todo lo que te tiran' },
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a35]">
        <div className="font-display text-2xl text-[#ff2d55] tracking-widest">BARDAPP</div>
        {profile && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white">{profile.username}</div>
              <div className="text-xs text-[#666680]">Nivel {profile.nivel} · {profile.titulo}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#2d0a12] border border-[#ff2d55] flex items-center justify-center text-xl">
              {profile.avatar_emoji}
            </div>
            <button onClick={logout} className="text-xs text-[#666680] hover:text-white transition-colors">salir</button>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Stats del jugador */}
        {profile && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { n: profile.victorias, label: 'victorias' },
              { n: profile.derrotas, label: 'derrotas' },
              { n: profile.puteadas_dadas, label: 'puteadas dadas' },
            ].map(s => (
              <div key={s.label} className="bg-[#141418] border border-[#2a2a35] rounded p-3 text-center">
                <div className="font-display text-2xl text-[#ffd60a]">{s.n}</div>
                <div className="text-xs text-[#666680] tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Matchmaking */}
        <div className="bg-[#141418] border border-[#2a2a35] rounded-lg p-6 mb-6">
          <h2 className="font-display text-xl text-white tracking-widest mb-5">ENCONTRAR RIVAL</h2>

          {!enCola ? (
            <>
              {/* Selector de modo */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(Object.keys(modoInfo) as Array<keyof typeof modoInfo>).map(m => (
                  <button
                    key={m}
                    onClick={() => setModo(m)}
                    className={`border rounded p-3 text-center transition-all ${modo === m ? 'border-[#ff2d55] bg-[#2d0a12]' : 'border-[#2a2a35] hover:border-[#666680]'}`}
                  >
                    <div className="text-2xl mb-1">{modoInfo[m].emoji}</div>
                    <div className={`font-display text-xs tracking-widest mb-1 ${modo === m ? 'text-[#ff2d55]' : 'text-white'}`}>{modoInfo[m].label}</div>
                    <div className="text-xs text-[#666680]">{modoInfo[m].desc}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={buscarMatch}
                disabled={buscando}
                className="w-full bg-[#ff2d55] text-white font-display tracking-widest py-4 rounded hover:bg-[#ff4d6d] transition-colors disabled:opacity-50 text-lg"
              >
                {buscando ? 'BUSCANDO...' : 'BUSCAR RIVAL 🎯'}
              </button>
            </>
          ) : (
            /* En cola - esperando rival */
            <div className="text-center py-4">
              <div className="text-4xl mb-4 animate-bounce">⚔️</div>
              <div className="font-display text-xl text-[#ff2d55] tracking-widest mb-2">BUSCANDO RIVAL</div>
              <div className="text-[#666680] text-sm mb-1">
                Modo: <span className="text-white">{modoInfo[modo].label}</span>
              </div>
              <div className="text-[#666680] text-sm mb-6">
                Esperando... <span className="text-[#ffd60a] font-bold">
                  {Math.floor(tiempoEspera/60).toString().padStart(2,'0')}:{(tiempoEspera%60).toString().padStart(2,'0')}
                </span>
              </div>
              <div className="flex justify-center gap-1 mb-6">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#ff2d55]"
                    style={{ animation: `typing 1s infinite ${i*0.2}s` }} />
                ))}
              </div>
              <button
                onClick={salirDeCola}
                className="border border-[#2a2a35] text-[#666680] font-mono text-sm px-6 py-2 rounded hover:border-[#ff2d55] hover:text-[#ff2d55] transition-colors"
              >
                cancelar búsqueda
              </button>
            </div>
          )}
        </div>

        {/* Duelos en vivo */}
        {duelosVivos.length > 0 && (
          <div>
            <h2 className="font-display text-lg text-white tracking-widest mb-4">DUELOS EN VIVO 🔴</h2>
            <div className="space-y-3">
              {duelosVivos.map(d => (
                <button
                  key={d.id}
                  onClick={() => router.push(`/duelo/${d.id}`)}
                  className="w-full bg-[#141418] border border-[#2a2a35] rounded p-4 text-left hover:border-[#ff2d55] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{(d.jugador1 as any)?.avatar_emoji || '😤'}</span>
                      <span className="text-sm font-bold text-white">{(d.jugador1 as any)?.username}</span>
                      <span className="text-[#666680] text-xs">vs</span>
                      <span className="text-sm font-bold text-white">{(d.jugador2 as any)?.username}</span>
                      <span className="text-lg">{(d.jugador2 as any)?.avatar_emoji || '😤'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#666680]">👁 {d.espectadores}</span>
                      <span className="bg-[#ff2d55] text-white text-xs px-2 py-0.5 rounded animate-pulse-red">EN VIVO</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1 bg-[#2a2a35] rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#ff2d55] to-[#0a84ff] transition-all"
                      style={{ width: `${d.votos_j1 + d.votos_j2 > 0 ? Math.round(d.votos_j1/(d.votos_j1+d.votos_j2)*100) : 50}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
