export default function BardAppGamingUI() {
  const cards = [
    {
      emoji: '😈',
      title: 'QUIERO
BARDEAR',
      desc: 'Buscá a alguien
que quiera recibir.',
      bg: 'from-red-500 to-red-900'
    },
    {
      emoji: '😭',
      title: 'QUIERO QUE
ME BARDEEN',
      desc: 'Hoy vine a sufrir
con humor.',
      bg: 'from-blue-400 to-blue-900'
    },
    {
      emoji: '⚔️',
      title: 'DUELO
BARDO MUTUO',
      desc: '1 vs 1, sin excusas.',
      bg: 'from-purple-500 to-purple-900'
    }
  ]

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[40px] border-[10px] border-black bg-[#1a1d27] shadow-2xl">

        {/* Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f2433] via-[#161922] to-[#111318]" />

        {/* Content */}
        <div className="relative z-10 px-5 pt-8 pb-28 text-white">

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-b from-orange-400 to-orange-700 px-6 py-3 rounded-2xl shadow-[0_8px_0_#5a2400] border border-orange-300/30">
              <span className="text-3xl">💀</span>
              <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg">
                BARDOAPP
              </h1>
            </div>

            <h2 className="mt-6 text-3xl font-black">Hola, Nico</h2>

            <p className="text-zinc-300 text-lg mt-2">
              Rango: <span className="font-bold text-yellow-400">Destructor Social ⭐</span>
            </p>

            <p className="text-xl font-black mt-1 text-yellow-300">
              Puntos semanales: 340
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {cards.map((card) => (
              <button
                key={card.title}
                className={`bg-gradient-to-b ${card.bg} rounded-2xl p-3 shadow-[0_6px_0_rgba(0,0,0,0.4)] border border-white/10 active:translate-y-1 active:shadow-none transition-all`}
              >
                <div className="text-5xl mb-3">{card.emoji}</div>

                <div className="text-lg font-black leading-tight whitespace-pre-line drop-shadow-md">
                  {card.title}
                </div>

                <div className="text-xs mt-3 text-white/80 whitespace-pre-line leading-tight font-medium">
                  {card.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Settings */}
          <div className="border-t border-white/10 pt-6">
            <div className="mb-5">
              <p className="font-black text-xl mb-3">Tipo de sala:</p>

              <div className="grid grid-cols-2 gap-3">
                <button className="bg-[#222631] border border-white/10 rounded-xl py-3 text-lg font-bold shadow-lg">
                  🔒 Privada
                </button>

                <button className="bg-gradient-to-b from-blue-400 to-blue-700 rounded-xl py-3 text-lg font-black shadow-[0_5px_0_#0d2f6b] border border-blue-200/20">
                  ✅ Pública
                </button>
              </div>
            </div>

            <div>
              <p className="font-black text-xl mb-3">Intensidad:</p>

              <div className="grid grid-cols-2 gap-3">
                <button className="bg-gradient-to-b from-blue-400 to-blue-700 rounded-xl py-3 text-lg font-black shadow-[0_5px_0_#0d2f6b] border border-blue-200/20">
                  ✅ Suave
                </button>

                <button className="bg-[#222631] border border-white/10 rounded-xl py-3 text-lg font-bold shadow-lg">
                  💀 Salvaje
                </button>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button className="w-full mt-8 bg-gradient-to-b from-yellow-300 to-yellow-500 text-black rounded-2xl py-5 text-3xl font-black shadow-[0_8px_0_#b57d00] active:translate-y-1 active:shadow-none transition-all border border-yellow-100/50">
            🚀 BUSCAR MATCH
          </button>

          <p className="text-center mt-6 text-xl font-bold text-zinc-200">
            Hoy no se llora... hoy se <span className="text-orange-400">BARDEA.</span>
          </p>
        </div>

        {/* Bottom Nav */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/70 backdrop-blur-xl border-t border-white/10 px-3 py-3">
          <div className="grid grid-cols-4 text-center text-white">
            <button className="flex flex-col items-center gap-1 text-zinc-300">
              <span className="text-3xl">🏠</span>
              <span className="text-xs font-semibold">Inicio</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-orange-400">
              <span className="text-3xl">🔥</span>
              <span className="text-xs font-bold">Live</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-zinc-300">
              <span className="text-3xl">🏆</span>
              <span className="text-xs font-semibold">Ranking</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-zinc-300">
              <span className="text-3xl">👤</span>
              <span className="text-xs font-semibold">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

