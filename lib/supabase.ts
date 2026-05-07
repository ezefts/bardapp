// lib/supabase.ts
// Cliente de Supabase para el browser (componentes cliente)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Tipos de la base de datos
export type Profile = {
  id: string
  username: string
  avatar_emoji: string
  nivel: number
  xp: number
  victorias: number
  derrotas: number
  puteadas_dadas: number
  titulo: string
  created_at: string
}

export type Duelo = {
  id: string
  jugador1_id: string
  jugador2_id: string
  estado: 'esperando' | 'en_curso' | 'terminado'
  ronda_actual: number
  total_rondas: number
  ganador_id: string | null
  votos_j1: number
  votos_j2: number
  espectadores: number
  jugador1?: Profile
  jugador2?: Profile
  created_at: string
}

export type Puteada = {
  id: string
  duelo_id: string
  autor_id: string
  texto: string
  ronda: number
  votos: number
  created_at: string
  autor?: Profile
}
