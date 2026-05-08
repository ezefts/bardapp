'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type Profile, type Duelo } from '@/lib/supabase'

export default function LobbyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [duelosVivos, setDuelosVivos] = useState<Duelo[]>([])
  const [usuariosOnline, setUsuariosOnline] = useState<Profile[]>([])
  const [modo, setModo] = useState<'duelo' | 'puteo' | 'recibo'>('duelo')
  const [buscando, setBuscando] = useState(false)
  const [enCola, setEnCola] = useState(false)
  const [tiempoEspera, setTiempoEspera] = useState(0)
  const [feedGlobal, setFeedGlobal] = useState<any[]>([])

  useEffect(() => {
    loadData()
    const ch = supabase.channel('matchmaking')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'duelos' }, handleNewDuelo)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'puteadas' }, handleNewPuteada)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  useEffect(() => {
    let iv: ReturnType<typeof setInterval>
    if (enCola) iv = setInterval(() => setTiempoEspera(t => t + 1), 1000)
    else setTiempoEspera(0)
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
      .limit(8)
    setDuelosVivos(duelos || [])

    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .order('created_at', { ascending: false })
      .limit(12)
    setUsuariosOnline(users || [])

    const { data: feed } = await supabase
      .from('puteadas')
      .select('*, autor:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(20)
    setFeedGlobal(feed || [])
  }

  async function handleNewDuelo(payload: any) {
    const duelo = payload.new
    const { data: { user } } = await supabase.auth.getUser()
    if (duelo.jugador1_id === user?.id || duelo.jugador2_id === user?.id) {
      router.push(`/duelo/${duelo.id}`)
    }
    loadData()
  }

  function handleNewPuteada(payload: any) {
    supabase.from('profiles').select('*').eq('id', payload.new.autor_id).single().then(({ data }) => {
      setFeedGlobal(prev => [{ ...payload.new, autor: data }, ...prev.slice(0, 19)])
    })
  }

  async function buscarMatch() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setBuscando(true)

    const modoCompatible = modo === 'puteo' ? 'recibo' : modo === 'recibo' ? 'puteo' : 'duelo'
    const { data: candidatos } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('modo', modoCompatible)
      .neq('user_id', user.id)
      .order('created_at')
      .limit(1)

    if (candidatos && candidatos.length > 0) {
      const rival = candidatos[0]
      await supabase.from('matchmaking_queue').delete().eq('user_id', rival.user_id)
      const { data: duelo } = await supabase
        .from('duelos')
        .insert({ jugador1_id: user.id, jugador2_id: rival.user_id, estado: 'en_curso' })
        .select().single()
      if (duelo) router.push(`/duelo/${duelo.id}`)
    } else {
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

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const modos = {
    duelo: { emoji:'⚔️', label:'DUELO', color:'#ffd60a' },
    puteo: { emoji:'😤', label:'PUTEO YO', color:'#ff2d55' },
    recibo: { emoji:'😏', label:'ME BARDEAN', color:'#0a84ff' },
  }

  return (
    <div style={{ background:'#0a0a0c', minHeight:'100vh', fontFamily:"'Space Mono',monospace", color:'#f0f0f5' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .online-dot{width:6px;height:6px;border-radius:50%;background:#30d158;flex-shrink:0}
        .nav-link{font-size:11px;color:#444455;letter-spacing:1px;cursor:pointer;padding:4px 0;transition:color .15s;text-decoration:none}
        .nav-link:hover,.nav-link.active{color:#ff2d55}
        .section-title{font-size:9px;color:#333344;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #1e1e28}
        .user-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #111116;cursor:pointer;transition:all .15s}
        .user-row:hover{padding-left:4px}
        .avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;border:1.5px solid #ff2d55;background:#2d0a12;flex-shrink:0}
        .modo-btn{flex:1;border:1px solid #1e1e28;background:#0d0d10;color:#444455;font-family:'Space Mono',monospace;font-size:9px;font-weight:700;letter-spacing:1px;padding:10px 6px;cursor:pointer;text-align:center;transition:all .15s}
        .modo-btn:hover{border-color:#333344;color:#888899}
        .modo-btn.sel-duelo{border-color:#ffd60a;background:#1a1600;color:#ffd60a}
        .modo-btn.sel-puteo{border-color:#ff2d55;background:#2d0a12;color:#ff2d55}
        .modo-btn.sel-recibo{border-color:#0a84ff;background:#0a1020;color:#0a84ff}
        .match-btn{width:100%;padding:14px;font-family:'Space Mono',monospace;font-size:12px;font-weight:700;letter-spacing:2px;cursor:pointer;border:none;transition:all .15s}
        .match-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
        .duelo-card{border:1px solid #1e1e28;padding:10px;cursor:pointer;transition:all .15s;margin-bottom:6px;animation:fadeIn .3s ease}
        .duelo-card:hover{border-color:#ff2d55;background:#140610}
        .live-badge{display:inline-block;background:#ff2d55;color:#fff;font-size:8px;font-weight:700;padding:2px 6px;letter-spacing:1px;animation:blink 1.5s infinite}
        .feed-msg{font-size:10px;color:#444455;padding:6px 0;border-bottom:1px solid #111116;line-height:1.5;animation:fadeIn .3s ease}
        .feed-author{color:#ff2d55;font-weight:700}
        .stat-box{background:#0d0d10;border:1px solid #1e1e28;padding:10px;text-align:center}
        .xp-bar{height:3px;background:#1e1e28;margin-top:8px;overflow:hidden}
        .xp-fill{height:100%;background:#ff2d55;transition:width .5s}
      `}</style>

      {/* TOP NAV */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', borderBottom:'1px solid #1e1e28', background:'rgba(10,10,12,.98)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:32 }}>
          <div style={{ fontFamily:'Impact,sans-serif', fontSize:20, color:'#ff2d55', letterSpacing:4 }}>BARDAPP</div>
          <nav style={{ display:'flex', gap:20 }}>
            <span className="nav-link active">LOBBY</span>
            <span className="nav-link" onClick={() => {}}>RANKING</span>
            <span className="nav-link" onClick={() => router.push('/perfil')}>MI PERFIL</span>
          </nav>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#30d158' }} />
            <span style={{ fontSize:10, color:'#444455' }}>{usuariosOnline.length + 847} online</span>
          </div>
          {profile && (
            <div style={{ display:'flex', alignItems:'center', gap:8, borderLeft:'1px solid #1e1e28', paddingLeft:12 }}>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#f0f0f5' }}>{profile.username}</div>
                <div style={{ fontSize:9, color:'#444455' }}>lvl {profile.nivel} · {profile.titulo}</div>
              </div>
              <div className="avatar" style={{ width:32, height:32 }}>{profile.avatar_emoji}</div>
              <button onClick={logout} style={{ fontSize:9, color:'#333344', cursor:'pointer', background:'none', border:'none', letterSpacing:1 }}>SALIR</button>
            </div>
          )}
        </div>
      </div>

      {/* 3 COLUMNAS */}
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr 220px', gap:0, minHeight:'calc(100vh - 53px)' }}>

        {/* COLUMNA IZQUIERDA */}
        <div style={{ borderRight:'1px solid #1e1e28', padding:'16px', overflowY:'auto' }}>

          {/* Mi perfil mini */}
          {profile && (
            <div style={{ marginBottom:20 }}>
              <div className="section-title">mi perfil</div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div className="avatar" style={{ width:40, height:40, fontSize:20 }}>{profile.avatar_emoji}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700 }}>{profile.username}</div>
                  <div style={{ fontSize:9, color:'#444455' }}>Nivel {profile.nivel}</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
                <div className="stat-box"><div style={{ fontFamily:'Impact,sans-serif', fontSize:20, color:'#ffd60a' }}>{profile.victorias}</div><div style={{ fontSize:8, color:'#333344', letterSpacing:1 }}>VICTORIAS</div></div>
                <div className="stat-box"><div style={{ fontFamily:'Impact,sans-serif', fontSize:20, color:'#444455' }}>{profile.derrotas}</div><div style={{ fontSize:8, color:'#333344', letterSpacing:1 }}>DERROTAS</div></div>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width:`${Math.min((profile.xp % 100), 100)}%` }} />
              </div>
              <div style={{ fontSize:8, color:'#333344', marginTop:4, letterSpacing:1 }}>{profile.xp} XP</div>
            </div>
          )}

          {/* Usuarios online */}
          <div className="section-title">online ahora</div>
          {usuariosOnline.slice(0, 10).map(u => (
            <div key={u.id} className="user-row">
              <div className="online-dot" />
              <div className="avatar" style={{ width:24, height:24, fontSize:12 }}>{u.avatar_emoji}</div>
              <div>
                <div style={{ fontSize:10, color:'#888899' }}>{u.username}</div>
                <div style={{ fontSize:8, color:'#333344' }}>lvl {u.nivel}</div>
              </div>
            </div>
          ))}
          {usuariosOnline.length === 0 && (
            <div style={{ fontSize:10, color:'#333344', paddingTop:8 }}>nadie más online todavía</div>
          )}
        </div>

        {/* COLUMNA CENTRAL */}
        <div style={{ padding:'20px 24px', overflowY:'auto' }}>

          {/* Matchmaking */}
          <div style={{ border:'1px solid #1e1e28', padding:'20px', marginBottom:20, background:'#0d0d10' }}>
            <div style={{ fontSize:11, color:'#ff2d55', letterSpacing:2, marginBottom:16, fontWeight:700 }}>// ENCONTRAR RIVAL</div>

            {!enCola ? (
              <>
                <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                  {(Object.keys(modos) as Array<keyof typeof modos>).map(m => (
                    <button key={m} className={`modo-btn ${modo === m ? `sel-${m}` : ''}`} onClick={() => setModo(m)}>
                      <div style={{ fontSize:18, marginBottom:4 }}>{modos[m].emoji}</div>
                      <div>{modos[m].label}</div>
                    </button>
                  ))}
                </div>
                <button
                  className="match-btn"
                  onClick={buscarMatch}
                  disabled={buscando}
                  style={{ background: modos[modo].color === '#ffd60a' ? '#ffd60a' : modos[modo].color, color: modos[modo].color === '#ffd60a' ? '#0a0a0c' : '#fff', opacity: buscando ? .6 : 1 }}
                >
                  {buscando ? 'BUSCANDO...' : `BUSCAR RIVAL — ${modos[modo].label} →`}
                </button>
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:32, marginBottom:12, animation:'pulse 1s infinite' }}>⚔️</div>
                <div style={{ fontFamily:'Impact,sans-serif', fontSize:18, color:'#ff2d55', letterSpacing:2, marginBottom:8 }}>BUSCANDO RIVAL</div>
                <div style={{ fontSize:11, color:'#ffd60a', marginBottom:4 }}>{fmt(tiempoEspera)}</div>
                <div style={{ fontSize:10, color:'#444455', marginBottom:16 }}>modo: {modos[modo].label}</div>
                <div style={{ display:'flex', justifyContent:'center', gap:4, marginBottom:16 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#ff2d55', animation:`blink 1s infinite ${i*.2}s` }} />)}
                </div>
                <button onClick={salirDeCola} style={{ fontSize:10, color:'#444455', background:'none', border:'1px solid #1e1e28', padding:'6px 16px', cursor:'pointer', letterSpacing:1, fontFamily:"'Space Mono',monospace" }}>
                  cancelar
                </button>
              </div>
            )}
          </div>

          {/* Duelos en vivo */}
          <div>
            <div style={{ fontSize:9, color:'#333344', letterSpacing:2, textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
              <span className="live-badge">● EN VIVO</span>
              <span>{duelosVivos.length} duelos activos</span>
            </div>
            {duelosVivos.length === 0 && (
              <div style={{ border:'1px solid #1e1e28', padding:'32px', textAlign:'center' }}>
                <div style={{ fontSize:24, marginBottom:8 }}>🥊</div>
                <div style={{ fontSize:11, color:'#333344' }}>no hay duelos activos</div>
                <div style={{ fontSize:10, color:'#222228', marginTop:4 }}>sé el primero en buscar rival</div>
              </div>
            )}
            {duelosVivos.map(d => {
              const j1 = d.jugador1 as any
              const j2 = d.jugador2 as any
              const total = d.votos_j1 + d.votos_j2
              const pct = total > 0 ? Math.round(d.votos_j1/total*100) : 50
              return (
                <div key={d.id} className="duelo-card" onClick={() => router.push(`/duelo/${d.id}`)}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <span className="live-badge">● EN VIVO</span>
                    <span style={{ fontSize:9, color:'#444455' }}>👁 {d.espectadores || 0}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 24px 1fr', alignItems:'center', gap:4, marginBottom:8 }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:16 }}>{j1?.avatar_emoji || '😤'}</div>
                      <div style={{ fontSize:10, color:'#888899', fontWeight:700 }}>{j1?.username}</div>
                      <div style={{ fontSize:11, color:'#ff2d55', fontFamily:'Impact,sans-serif' }}>{d.votos_j1}</div>
                    </div>
                    <div style={{ fontSize:10, color:'#333344', textAlign:'center', fontFamily:'Impact,sans-serif' }}>VS</div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:16 }}>{j2?.avatar_emoji || '😤'}</div>
                      <div style={{ fontSize:10, color:'#888899', fontWeight:700 }}>{j2?.username}</div>
                      <div style={{ fontSize:11, color:'#0a84ff', fontFamily:'Impact,sans-serif' }}>{d.votos_j2}</div>
                    </div>
                  </div>
                  <div style={{ height:2, background:'#1e1e28', overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'linear-gradient(90deg,#ff2d55,#0a84ff)', width:`${pct}%`, transition:'width .5s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA — FEED */}
        <div style={{ borderLeft:'1px solid #1e1e28', padding:'16px', overflowY:'auto' }}>
          <div className="section-title">feed global</div>
          {feedGlobal.length === 0 && (
            <div style={{ fontSize:10, color:'#333344', paddingTop:8 }}>las puteadas aparecen acá en tiempo real</div>
          )}
          {feedGlobal.map((p, i) => (
            <div key={p.id || i} className="feed-msg">
              <span className="feed-author">{(p.autor as any)?.username || 'anon'}</span>
              <span style={{ color:'#222228' }}> · r{p.ronda}</span>
              <div style={{ marginTop:3, color:'#444455', fontSize:10 }}>"{p.texto?.slice(0, 80)}{p.texto?.length > 80 ? '...' : ''}"</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
