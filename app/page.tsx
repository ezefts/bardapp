'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)
  const [count, setCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/lobby')
      else setChecking(false)
    })
    // Contador animado
    let n = 0
    const target = 1247
    const iv = setInterval(() => {
      n += Math.ceil((target - n) / 8)
      if (n >= target) { n = target; clearInterval(iv) }
      setCount(n)
    }, 30)
    return () => clearInterval(iv)
  }, [])

  if (checking) return (
    <div style={{ background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ fontFamily: 'Impact, sans-serif', fontSize: 32, color: '#ff2d55', letterSpacing: 6, animation: 'pulse 1s infinite' }}>BARDAPP</div>
    </div>
  )

  return (
    <div style={{ background: '#0a0a0c', minHeight: '100vh', fontFamily: "'Space Mono', monospace", color: '#f0f0f5', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        .scan::after { content:''; position:fixed; top:0; left:0; right:0; height:2px; background:rgba(255,45,85,.06); animation:scanline 4s linear infinite; pointer-events:none; }
        .btn-primary { background:#ff2d55; color:#fff; border:none; padding:14px 32px; font-family:'Space Mono',monospace; font-size:13px; font-weight:700; letter-spacing:2px; cursor:pointer; transition:all .15s; }
        .btn-primary:hover { background:#ff4d6d; transform:translateY(-1px); }
        .btn-ghost { background:transparent; color:#f0f0f5; border:1px solid #2a2a35; padding:14px 32px; font-family:'Space Mono',monospace; font-size:13px; font-weight:700; letter-spacing:2px; cursor:pointer; transition:all .15s; }
        .btn-ghost:hover { border-color:#ff2d55; color:#ff2d55; }
        .mode-card { border:1px solid #1e1e28; padding:20px 16px; text-align:center; background:#0d0d10; transition:all .2s; cursor:default; }
        .mode-card:hover { border-color:#ff2d55; background:#140610; }
        .ticker-item { display:flex; align-items:center; gap:12px; padding:0 32px; white-space:nowrap; font-size:12px; color:#333344; }
        .ticker-item b { color:#ff2d55; }
      `}</style>

      {/* Scanline effect */}
      <div className="scan" />

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 40px', borderBottom:'1px solid #1e1e28', position:'sticky', top:0, background:'rgba(10,10,12,.95)', backdropFilter:'blur(8px)', zIndex:100 }}>
        <div style={{ fontFamily:'Impact,sans-serif', fontSize:24, color:'#ff2d55', letterSpacing:4 }}>BARDAPP</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#ff2d55', animation:'blink 1s infinite' }} />
          <span style={{ fontSize:11, color:'#666680', letterSpacing:1 }}>{count.toLocaleString()} barderos online</span>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button className="btn-ghost" style={{ padding:'8px 20px', fontSize:11 }} onClick={() => router.push('/auth?mode=login')}>ENTRAR</button>
          <button className="btn-primary" style={{ padding:'8px 20px', fontSize:11 }} onClick={() => router.push('/auth?mode=register')}>REGISTRARSE</button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign:'center', padding:'80px 40px 60px', animation:'slideUp .6s ease' }}>
        <div style={{ fontSize:11, color:'#ff2d55', letterSpacing:4, marginBottom:24, textTransform:'uppercase' }}>// plataforma de bardeo en tiempo real</div>
        <div style={{ fontFamily:'Impact,sans-serif', fontSize:'clamp(56px, 10vw, 112px)', lineHeight:.9, color:'#f0f0f5', letterSpacing:4, marginBottom:8 }}>
          BARDEÁ<br /><span style={{ color:'#ff2d55' }}>O CALLATE</span>
        </div>
        <div style={{ fontSize:13, color:'#444455', maxWidth:480, margin:'24px auto 40px', lineHeight:1.8 }}>
          Duelos de puteadas en tiempo real. Matchmaking instantáneo. La gente vota. El mejor bardero gana.
        </div>
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn-primary" style={{ fontSize:14, padding:'16px 40px' }} onClick={() => router.push('/auth?mode=register')}>
            ENTRAR AL RING →
          </button>
          <button className="btn-ghost" style={{ fontSize:14, padding:'16px 40px' }} onClick={() => router.push('/auth?mode=login')}>
            YA TENGO CUENTA
          </button>
        </div>
      </div>

      {/* Ticker de puteadas */}
      <div style={{ borderTop:'1px solid #1e1e28', borderBottom:'1px solid #1e1e28', padding:'12px 0', overflow:'hidden', position:'relative', background:'#0a0a0c' }}>
        <div style={{ display:'flex', animation:'none', gap:0 }}>
          {['LaPerrona destruyó a MrRage99 (847 votos)', 'Puteatron ganó su duelo 312-89', 'SaltaMontes está en racha de 7 victorias', 'Nuevo duelo: CrackRodrigo vs ElVerdadero', 'LaPerrona destruyó a MrRage99 (847 votos)'].map((t, i) => (
            <div key={i} className="ticker-item">
              <span style={{ color:'#ff2d55' }}>●</span> <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modos */}
      <div style={{ maxWidth:960, margin:'80px auto', padding:'0 40px' }}>
        <div style={{ fontSize:11, color:'#333344', letterSpacing:3, textAlign:'center', marginBottom:40, textTransform:'uppercase' }}>elegí tu modo de juego</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
          {[
            { emoji:'😤', title:'PUTEO YO', desc:'Te matchea con alguien que quiere recibirla. Soltás todo sin freno.', color:'#ff2d55' },
            { emoji:'⚔️', title:'DUELO', desc:'Los dos bardeamos. Cinco rondas. El público vota las mejores puteadas.', color:'#ffd60a' },
            { emoji:'😏', title:'ME BARDEAN', desc:'Aguantás todo lo que te tiran. Sos el blanco. El que no se raja gana.', color:'#0a84ff' },
          ].map(m => (
            <div key={m.title} className="mode-card">
              <div style={{ fontSize:40, marginBottom:16 }}>{m.emoji}</div>
              <div style={{ fontFamily:'Impact,sans-serif', fontSize:18, color:m.color, letterSpacing:2, marginBottom:8 }}>{m.title}</div>
              <div style={{ fontSize:11, color:'#444455', lineHeight:1.7 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ background:'#0d0d10', borderTop:'1px solid #1e1e28', borderBottom:'1px solid #1e1e28', padding:'48px 40px' }}>
        <div style={{ maxWidth:720, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24, textAlign:'center' }}>
          {[
            { n:'1.2K', label:'barderos online' },
            { n:'847', label:'duelos hoy' },
            { n:'94K', label:'puteadas enviadas' },
            { n:'12M', label:'votos emitidos' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily:'Impact,sans-serif', fontSize:40, color:'#ff2d55', letterSpacing:2 }}>{s.n}</div>
              <div style={{ fontSize:10, color:'#333344', letterSpacing:2, textTransform:'uppercase', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA final */}
      <div style={{ textAlign:'center', padding:'80px 40px' }}>
        <div style={{ fontFamily:'Impact,sans-serif', fontSize:40, color:'#f0f0f5', letterSpacing:3, marginBottom:24 }}>
          ¿TENÉS HUEVO?
        </div>
        <button className="btn-primary" style={{ fontSize:16, padding:'20px 56px' }} onClick={() => router.push('/auth?mode=register')}>
          ENTRAR AL RING →
        </button>
        <div style={{ marginTop:24, fontSize:11, color:'#2a2a35' }}>
          gratis · sin censura · usuarios reales
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop:'1px solid #1e1e28', padding:'24px 40px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:'Impact,sans-serif', fontSize:16, color:'#333344', letterSpacing:3 }}>BARDAPP</div>
        <div style={{ fontSize:10, color:'#1e1e28', letterSpacing:1 }}>plataforma de bardeo consensuado entre adultos</div>
      </div>
    </div>
  )
}

