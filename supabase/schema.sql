-- =====================================================
-- BARDAPP - Schema completo para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

-- EXTENSIONES
create extension if not exists "uuid-ossp";

-- =====================================================
-- TABLA: profiles
-- Se crea automáticamente cuando un usuario se registra
-- =====================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_emoji text default '😤',
  nivel integer default 1,
  xp integer default 0,
  victorias integer default 0,
  derrotas integer default 0,
  puteadas_dadas integer default 0,
  titulo text default 'Bardero Novato',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles son públicos para leer"
  on public.profiles for select using (true);

create policy "Usuario puede editar su propio perfil"
  on public.profiles for update using (auth.uid() = id);

create policy "Usuario puede insertar su propio perfil"
  on public.profiles for insert with check (auth.uid() = id);

-- =====================================================
-- TABLA: matchmaking_queue
-- Cola de espera para hacer match
-- =====================================================
create table public.matchmaking_queue (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  modo text check (modo in ('puteo', 'recibo', 'duelo')) default 'duelo',
  created_at timestamptz default now()
);

alter table public.matchmaking_queue enable row level security;

create policy "Cualquiera puede ver la cola"
  on public.matchmaking_queue for select using (true);

create policy "Usuario maneja su propia entrada"
  on public.matchmaking_queue for all using (auth.uid() = user_id);

-- =====================================================
-- TABLA: duelos
-- Cada duelo entre dos jugadores
-- =====================================================
create table public.duelos (
  id uuid default uuid_generate_v4() primary key,
  jugador1_id uuid references public.profiles(id),
  jugador2_id uuid references public.profiles(id),
  estado text check (estado in ('esperando', 'en_curso', 'terminado')) default 'esperando',
  ronda_actual integer default 1,
  total_rondas integer default 5,
  ganador_id uuid references public.profiles(id),
  votos_j1 integer default 0,
  votos_j2 integer default 0,
  espectadores integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.duelos enable row level security;

create policy "Duelos son públicos para leer"
  on public.duelos for select using (true);

create policy "Jugadores pueden actualizar su duelo"
  on public.duelos for update using (
    auth.uid() = jugador1_id or auth.uid() = jugador2_id
  );

create policy "Sistema puede insertar duelos"
  on public.duelos for insert with check (true);

-- =====================================================
-- TABLA: puteadas
-- Cada mensaje dentro de un duelo
-- =====================================================
create table public.puteadas (
  id uuid default uuid_generate_v4() primary key,
  duelo_id uuid references public.duelos(id) on delete cascade,
  autor_id uuid references public.profiles(id),
  texto text not null,
  ronda integer not null,
  votos integer default 0,
  created_at timestamptz default now()
);

alter table public.puteadas enable row level security;

create policy "Puteadas son públicas para leer"
  on public.puteadas for select using (true);

create policy "Jugadores pueden insertar puteadas en su duelo"
  on public.puteadas for insert with check (auth.uid() = autor_id);

-- =====================================================
-- TABLA: votos
-- Un voto por usuario por puteada
-- =====================================================
create table public.votos (
  id uuid default uuid_generate_v4() primary key,
  puteada_id uuid references public.puteadas(id) on delete cascade,
  voter_id uuid references public.profiles(id),
  unique(puteada_id, voter_id),
  created_at timestamptz default now()
);

alter table public.votos enable row level security;

create policy "Cualquiera puede ver votos"
  on public.votos for select using (true);

create policy "Usuario vota una vez por puteada"
  on public.votos for insert with check (auth.uid() = voter_id);

-- =====================================================
-- FUNCIÓN: auto-crear perfil al registrarse
-- =====================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_emoji)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_emoji', '😤')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- FUNCIÓN: incrementar votos en puteada
-- =====================================================
create or replace function public.votar_puteada(p_puteada_id uuid, p_voter_id uuid)
returns void as $$
declare
  v_duelo_id uuid;
  v_autor_id uuid;
  v_jugador1_id uuid;
begin
  -- Insertar voto (falla si ya votó - constraint unique)
  insert into public.votos (puteada_id, voter_id) values (p_puteada_id, p_voter_id);
  
  -- Incrementar contador en puteada
  update public.puteadas set votos = votos + 1 where id = p_puteada_id
  returning duelo_id, autor_id into v_duelo_id, v_autor_id;
  
  -- Actualizar votos en el duelo
  select jugador1_id into v_jugador1_id from public.duelos where id = v_duelo_id;
  
  if v_autor_id = v_jugador1_id then
    update public.duelos set votos_j1 = votos_j1 + 1 where id = v_duelo_id;
  else
    update public.duelos set votos_j2 = votos_j2 + 1 where id = v_duelo_id;
  end if;
end;
$$ language plpgsql security definer;

-- =====================================================
-- HABILITAR REALTIME en las tablas clave
-- =====================================================
alter publication supabase_realtime add table public.duelos;
alter publication supabase_realtime add table public.puteadas;
alter publication supabase_realtime add table public.matchmaking_queue;
alter publication supabase_realtime add table public.votos;

-- =====================================================
-- ÍNDICES para performance
-- =====================================================
create index on public.puteadas(duelo_id);
create index on public.duelos(estado);
create index on public.matchmaking_queue(created_at);
create index on public.votos(puteada_id);
