'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient, type Profile, type Duelo, type Puteada } from '@/lib/supabase'

export default function DueloPage() {
  const router = useRouter()
  const params = useParams()
  const dueloId = params.id as string
  const supabase = createClient()

  const [duelo, setDuelo] = useState<Duelo | null>(null)
  const [puteadas, setPuteadas] = useState<Puteada[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [rival, setRival] = useState<Profile | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [yaVote, setYaVote] = useState<Set<string>>(new Set())
  const [esJugador, setEsJugador] = useState(false)
  const [miTurno, setMiTurno] = useState(false)
  const [spectadores, setSpectadores] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    init()
    // Suscripción realtime
    const channel = supabase
      .channel(`duelo-${dueloId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'puteadas', filter: `duelo_id=eq.${dueloId}` }, handleNewPuteada)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duelos', filter: `id=eq.${dueloId}` }, handleDueloUpdate)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'puteadas', filter: `duelo_id=eq.${dueloId}` }, handleVoteUpdate)
      .subscribe()

    // Simular spectadores que van y vienen
    const specIv = setInterval(() => {
      setSpectadores(s => Math.max(1, s + Math.floor(Math.random() * 10 - 4)))
    }, 4000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(specIv)
    }
  }, [dueloId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [puteadas, isTyping])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/'); return }

    // Cargar perfil propio
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    // Cargar duelo con perfiles
    const { data: d } = await supabase
      .from('duelos')
      .select('*, jugador1:profiles!jugador1_id(*), jugador2:profiles!jugador2_id(*)')
      .eq('id', dueloId)
      .single()

    if (!d) { router.replace('/lobby'); return }
    setDuelo(d)
    setSpectadores(d.espectadores || Math.floor(Math.random() * 200) + 50)

    const soyJ1 = d.jugador1_id === user.id
    const soyJ2 = d.jugador2_id === user.id
    setEsJugador(soyJ1 || soyJ2)

    if (soyJ1) setRival(d.jugador2 as any)
    else if (soyJ2) setRival(d.jugador1 as any)

    // Cargar puteadas existentes
    const { data: putes } = await supabase
      .from('puteadas')
      .select('*, autor:profiles(*)')
      .eq('duelo_id', dueloId)
      .order('created_at')
    setPuteadas(putes || [])

    // Determinar turno
    calcularTurno(d, putes || [], user.id)

    // Incrementar espectadores si no es jugador
    if (!soyJ1 && !soyJ2) {
      await supabase.from('duelos').update({ espectadores: (d.espectadores || 0) + 1 }).eq('id', dueloId)
    }
  }

  function calcularTurno(d: any, putes: Puteada[], userId: string) {
    // En la ronda actual, si no hay puteada mía, es mi turno
    const enRonda = putes.filter(p => p.ronda === d.ronda_actual)
    const yoPutee = enRonda.some(p => p.autor_id === userId)
    const soyJugador = d.jugador1_id === userId || d.jugador2_id === userId
    setMiTurno(soyJugador && !yoPutee)
  }

  function handleNewPuteada(payload: any) {
    const nueva = payload.new
    setPuteadas(prev => {
      if (prev.find(p => p.id === nueva.id)) return prev
      // Cargar perfil del autor
      supabase.from('profiles').select('*').eq('id', nueva.autor_id).single().then(({ data }) => {
        setPuteadas(pp => pp.map(p => p.id === nueva.id ? { ...p, autor: data as any } : p))
      })
      return [...prev, nueva]
    })
    setIsTyping(false)
    // Recalcular turno
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && duelo) {
        supabase.from('duelos').select('*').eq('id', dueloId).single().then(({ data: d }) => {
          if (d) {
            setDuelo(prev => ({ ...prev!, ...d }))
            supabase.from('puteadas').select('*').eq('duelo_id', dueloId).then(({ data }) => {
              calcularTurno(d, data || [], user.id)
            })
          }
        })
      }
    })
  }

  function handleDueloUpdate(payload: any) {
    setDuelo(prev => prev ? { ...prev, ...payload.new } : null)
    if (payload.new.estado === 'terminado') {
      // Mostrar pantalla de fin
    }
  }

  function handleVoteUpdate(payload: any) {
    setPuteadas(prev => prev.map(p => p.id === payload.new.id ? { ...p, votos: payload.new.votos } : p))
  }

  async function enviarPuteada() {
    if (!texto.trim() || !profile || enviando || !miTurno) return
    setEnviando(true)
    setIsTyping(true)

    const { error } = await supabase.from('puteadas').insert({
      duelo_id: dueloId,
      autor_id: profile.id,
      texto: texto.trim(),
      ronda: duelo?.ronda_actual || 1,
    })

    if (!error) {
      setTexto('')
      setMiTurno(false)
      // Avanzar ronda si los dos putearon
      const { data: putes } = await supabase.from('puteadas').select('*').eq('duelo_id', dueloId).eq('ronda', duelo?.ronda_actual || 1)
      if (putes && putes.length >= 2) {
        const nuevaRonda = (duelo?.ronda_actual || 1) + 1
        if (nuevaRonda > (duelo?.total_rondas || 5)) {
          // Fin del duelo
          const ganadorId = (duelo?.votos_j1 || 0) >= (duelo?.votos_j2 || 0)
            ? duelo?.jugador1_id : duelo?.jugador2_id
          await supabase.from('duelos').update({ estado: 'terminado', ronda_actual: nuevaRonda - 1, ganador_id: ganadorId }).eq('id', dueloId)
        } else {
          await supabase.from('duelos').update({ ronda_actual: nuevaRonda }).eq('id', dueloId)
        }
      }
      // Incrementar stat
      await supabase.from('profiles').update({ puteadas_dadas: (profile.puteadas_dadas || 0) + 1 }).eq('id', profile.id)
    }
    setEnviando(false)
    setIsTyping(false)
    inputRef.current?.focus()
  }

  async function votar(puteadaId: string) {
    if (!profile || yaVote.has(puteadaId)) return
    setYaVote(prev => new Set([...prev, puteadaId]))
    await supabase.rpc('votar_puteada', { p_puteada_id: puteadaId, p_voter_id: profile.id })
  }

  if (!duelo) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-[#ff2d55] font-display text-2xl tracking-widest animate-pulse">CARGANDO DUELO...</div>
    </div>
  )

  const j1 = duelo.jugador1 as any as Profile
  const j2 = duelo.jugador2 as any as Profile
  const totalVotos = duelo.votos_j1 + duelo.votos_j2
  const pctJ1 = totalVotos > 0 ? Math.round(duelo.votos_j1 / totalVotos * 100) : 50
  const terminado = duelo.estado === 'terminado'
  const yoGane = terminado && duelo.ganador_id === profile?.id

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a35] bg-[#0d0d0f] sticky top-0 z-10">
        <button onClick={() => router.push('/lobby')} className="text-[#666680] text-sm hover:text-white transition-colors">← lobby</button>
        <div className="flex items-center gap-2">
          {!terminado && <span className="bg-[#ff2d55] text-white text-xs px-2 py-0.5 rounded animate-pulse-red">EN VIVO</span>}
          <span className="text-xs text-[#666680]">👁 {spectadores}</span>
        </div>
      </div>

      {/* Fighters banner */}
      <div className="grid grid-cols-[1fr_48px_1fr] items-center px-4 py-4 border-b border-[#2a2a35] bg-[#141418]">
        <div className="text-center">
          <div className="text-2xl mb-1">{j1?.avatar_emoji || '😤'}</div>
          <div className="font-bold text-xs text-white">{j1?.username}</div>
          <div className="font-display text-xl text-[#ff2d55] mt-1">{duelo.votos_j1}</div>
        </div>
        <div className="text-center">
          <div className="text-[#666680] font-display text-sm">VS</div>
          <div className="text-[#444455] text-xs">{duelo.ronda_actual}/{duelo.total_rondas}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-1">{j2?.avatar_emoji || '😤'}</div>
          <div className="font-bold text-xs text-white">{j2?.username}</div>
          <div className="font-display text-xl text-[#0a84ff] mt-1">{duelo.votos_j2}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#2a2a35]">
        <div className="h-full bg-gradient-to-r from-[#ff2d55] to-[#0a84ff] transition-all duration-500" style={{ width: `${pctJ1}%` }} />
      </div>

      {/* Puteadas */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {puteadas.map((p, i) => {
          const esJ1 = p.autor_id === j1?.id
          const esMia = p.autor_id === profile?.id
          const autor = p.autor as any as Profile
          return (
            <div key={p.id} className={`flex gap-3 items-start animate-fade-in ${esMia ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 border ${esJ1 ? 'bg-[#2d0a12] border-[#ff2d55]' : 'bg-[#0a1a2d] border-[#0a84ff]'}`}>
                {autor?.avatar_emoji || '😤'}
              </div>
              <div className={`max-w-[75%] ${esMia ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="text-xs text-[#666680] mb-1">{autor?.username} · ronda {p.ronda}</div>
                <div className={`px-4 py-3 rounded text-sm leading-relaxed ${esMia
                  ? 'bg-[#2d0a12] border border-[#ff2d55] text-[#ffb3c1] rounded-tr-none'
                  : 'bg-[#0a1020] border border-[#0a84ff] text-[#a8c8ff] rounded-tl-none'
                }`}>
                  {p.texto}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => votar(p.id)}
                    disabled={esMia || yaVote.has(p.id)}
                    className={`text-xs px-3 py-1 rounded border transition-all ${yaVote.has(p.id)
                      ? 'bg-[#1a1500] border-[#ffd60a] text-[#ffd60a]'
                      : esMia
                        ? 'opacity-30 cursor-not-allowed border-[#2a2a35] text-[#666680]'
                        : 'border-[#2a2a35] text-[#666680] hover:border-[#ffd60a] hover:text-[#ffd60a] cursor-pointer'
                    }`}
                  >
                    🔥 {p.votos || 0}
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-[#0a1a2d] border border-[#0a84ff] flex items-center justify-center text-lg">
              {rival?.avatar_emoji || '😤'}
            </div>
            <div className="bg-[#0a1020] border border-[#0a84ff] px-4 py-3 rounded rounded-tl-none flex gap-1 items-center">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0a84ff]"
                  style={{ animation: `typing 1s infinite ${i*0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Fin del duelo */}
        {terminado && (
          <div className="text-center py-8 border border-[#2a2a35] rounded-lg my-4">
            <div className="text-5xl mb-3">{yoGane ? '🏆' : '💀'}</div>
            <div className="font-display text-2xl tracking-widest mb-2" style={{ color: yoGane ? '#ffd60a' : '#0a84ff' }}>
              {yoGane ? '¡GANASTE!' : esJugador ? 'TE DIERON' : 'DUELO TERMINADO'}
            </div>
            <div className="text-[#666680] text-sm mb-4">
              {duelo.votos_j1} vs {duelo.votos_j2} votos
            </div>
            <button onClick={() => router.push('/lobby')} className="bg-[#ff2d55] text-white font-display tracking-widest px-8 py-3 rounded hover:bg-[#ff4d6d] transition-colors">
              VOLVER AL LOBBY
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input - solo para jugadores y si no terminó */}
      {esJugador && !terminado && (
        <div className="sticky bottom-0 bg-[#0d0d0f] border-t border-[#2a2a35] px-4 py-3">
          <div className="text-xs text-center mb-2" style={{ color: miTurno ? '#ffd60a' : '#666680' }}>
            {miTurno ? '⚡ TU TURNO — MANDÁ TU PUTEADA' : 'esperando al rival...'}
          </div>
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarPuteada() } }}
              disabled={!miTurno || enviando}
              placeholder={miTurno ? "soltá todo lo que tenés..." : "esperando al rival..."}
              rows={2}
              className="flex-1 bg-[#141418] border border-[#2a2a35] text-white font-mono text-sm px-3 py-2 rounded resize-none focus:border-[#ff2d55] outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <button
              onClick={enviarPuteada}
              disabled={!miTurno || !texto.trim() || enviando}
              className="bg-[#ff2d55] text-white font-display tracking-widest px-4 rounded hover:bg-[#ff4d6d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {enviando ? '...' : 'MANDAR'}
            </button>
          </div>
        </div>
      )}

      {/* Spectator mode */}
      {!esJugador && !terminado && (
        <div className="sticky bottom-0 bg-[#141418] border-t border-[#2a2a35] px-4 py-3 text-center">
          <div className="text-xs text-[#666680]">👀 Estás mirando como espectador · votá las mejores puteadas arriba</div>
        </div>
      )}
    </div>
  )
}
