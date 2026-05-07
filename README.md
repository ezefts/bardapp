# 🔥 BARDAPP — Guía de instalación paso a paso

## ¿Qué es esto?
App web completa de duelos de puteadas en tiempo real. Stack:
- **Next.js 14** — frontend + API
- **Supabase** — base de datos + auth + tiempo real (WebSockets gratis)
- **Vercel** — deploy automático con cada commit
- **Anthropic** — IA como oponente (opcional)

---

## PASO 1 — Crear cuenta en Supabase (gratis)

1. Ir a **https://supabase.com** y crear cuenta (con GitHub es más rápido)
2. Click en **"New Project"**
3. Nombre del proyecto: `bardapp`
4. Elegir una contraseña de base de datos (guardala)
5. Región: **South America (São Paulo)** — más cerca = más rápido
6. Click **"Create new project"** y esperar ~2 minutos

---

## PASO 2 — Crear las tablas en Supabase

1. En tu proyecto de Supabase, ir al menú lateral → **SQL Editor**
2. Click en **"New query"**
3. Copiar **TODO** el contenido del archivo `supabase/schema.sql`
4. Pegarlo en el editor
5. Click en **"Run"** (botón verde)
6. Debería decir "Success. No rows returned" — eso está bien ✅

---

## PASO 3 — Obtener las claves de Supabase

1. En tu proyecto Supabase, ir a **Settings** (ícono engranaje abajo a la izquierda)
2. Click en **"API"**
3. Copiar estos dos valores:
   - **Project URL** → `https://XXXXXX.supabase.co`
   - **anon public** key → `eyJhbGci...` (la clave larga)

---

## PASO 4 — Subir el código a GitHub

1. Crear cuenta en **https://github.com** si no tenés
2. Crear un repositorio nuevo llamado `bardapp` (público)
3. Descargar e instalar **GitHub Desktop**: https://desktop.github.com
4. En GitHub Desktop: **File → Add Local Repository**
5. Seleccionar la carpeta `bardapp` (esta carpeta)
6. Click **"Publish repository"**

---

## PASO 5 — Deploy en Vercel

1. Ir a **https://vercel.com** y crear cuenta (con GitHub)
2. Click en **"Add New Project"**
3. Importar el repositorio `bardapp`
4. En la sección **"Environment Variables"**, agregar:

```
NEXT_PUBLIC_SUPABASE_URL        = https://XXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGci...
ANTHROPIC_API_KEY               = sk-ant-...  (opcional, para modo IA)
```

5. Click **"Deploy"**
6. Esperar ~3 minutos
7. ¡Tu app está live en `https://bardapp-xxx.vercel.app`! 🎉

---

## PASO 6 — Configurar dominio (opcional)

1. En Vercel → tu proyecto → **Settings → Domains**
2. Podés agregar un dominio propio si tenés uno
3. O compartir el link de Vercel directamente

---

## PASO 7 — Probar la app

1. Abrir tu URL de Vercel
2. Registrarte con tu email
3. Elegir usuario y avatar
4. Buscar rival (necesitás al menos 2 personas conectadas)
5. ¡A bardearse!

---

## Cómo funciona el matchmaking

- Si elegís **DUELO**: te matchea con otro que también eligió DUELO
- Si elegís **PUTEO YO**: te matchea con alguien que eligió **ME BARDEAN**
- Si no hay nadie disponible, entrás a la cola y esperás
- Cuando llega un rival, los dos son redirigidos automáticamente al duelo

## Cómo funciona el duelo

1. Son **5 rondas**
2. En cada ronda, **los dos mandan una puteada**
3. El que ya mandó espera al rival
4. Los **espectadores votan** las mejores puteadas (botón 🔥)
5. Gana el que acumula más votos al final

---

## Estructura del proyecto

```
bardapp/
├── app/
│   ├── page.tsx          ← Landing page
│   ├── auth/page.tsx     ← Login / Registro
│   ├── lobby/page.tsx    ← Hub principal (buscar rival, ver duelos)
│   └── duelo/[id]/       ← El duelo en tiempo real
├── lib/
│   ├── supabase.ts       ← Cliente Supabase (browser)
│   └── supabase-server.ts← Cliente Supabase (server)
├── supabase/
│   └── schema.sql        ← Tablas y funciones de la DB
└── .env.example          ← Variables de entorno (renombrar a .env.local)
```

---

## Costos

| Servicio | Plan | Costo |
|----------|------|-------|
| Supabase | Free | $0/mes (hasta 500MB, 2GB transfer) |
| Vercel | Hobby | $0/mes |
| Anthropic | Pay per use | ~$0.001 por duelo con IA |

**Total para empezar: $0** 🎉

---

## Para correr en tu computadora (desarrollo local)

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de variables
cp .env.example .env.local
# Editar .env.local con tus claves de Supabase

# 3. Correr
npm run dev

# 4. Abrir http://localhost:3000
```

Necesitás tener **Node.js 18+** instalado: https://nodejs.org

---

## Próximas features para agregar

- [ ] Sistema de niveles y XP automático
- [ ] Sala de espectadores con emojis en tiempo real
- [ ] Torneos semanales con bracket
- [ ] Perfil público con historial de duelos
- [ ] Modo con IA como oponente (para cuando no hay rivales)
- [ ] Notificaciones cuando alguien te reta
- [ ] Leaderboard global

---

## Problemas comunes

**"Error: Invalid API key"**
→ Verificar que copiaste bien las claves de Supabase en Vercel

**"relation does not exist"**
→ El schema.sql no se ejecutó correctamente. Repetir el paso 2.

**Matchmaking no funciona**
→ Verificar que Realtime está habilitado en Supabase: Database → Replication → activar las tablas

---

Hecho con 🔥 y muchas ganas de bardearse
