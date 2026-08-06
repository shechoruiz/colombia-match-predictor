# Colombia Match Predictor

App web de portafolio que predice resultados del fútbol colombiano (Liga BetPlay DIMAYOR — Primera A) con estadísticas. Selecciona el escudo de un equipo, mira su próximo partido, obtén una predicción 1X2 explicable en español y comprueba si aciertan tus últimas 5 predicciones.

**Sitio en vivo:** https://colombia-match-predictor.netlify.app

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite + TypeScript (strict) |
| Estado | TanStack Query (server) · Zustand (global) · `useState` (UI) |
| Estilos | Tailwind CSS v4 |
| Testing | Vitest + React Testing Library + MSW |
| Datos | API-Football (liga 239, key dev-only) · TheSportsDB (escudos) |
| Validación | Zod |
| Despliegue | Netlify (deploy continuo: vista previa por PR + producción en merge a `main`) |

## Progreso

| Fase | Estado | PR |
|------|--------|----|
| **1. Scafold & dominio** | ✅ Completo | PR 2 |
| **2. Modelo de predicción** | ✅ Completo | PR 4 |
| **3a. Adaptadores + caché** | ✅ Completo | PR 7–8 |
| **3b. Fuente mock + DI** | ✅ Completo | PR 10 |
| **4. UI responsive** | ✅ Completo | PR 13–14 |
| **5. Historial + reconciliación** | ✅ Completo | PR 17–18 |
| Fix (warnings de verify) | ✅ Completo | PR 20 |
| **Consumo de dato real** | ⏳ Pendiente | — |

## Arranque rápido

```bash
# Requisitos: Node 20+, npm 11+

# Instalar dependencias
npm install

# Iniciar desarrollo (Vite)
npm run dev

# (Opcional) Configurar key de API-Football para datos reales
node scripts/manage-keys.mjs set API_FOOTBALL_KEY <key>
```

> Sin API key la app usa la fuente mock integrada. Los despliegues de producción usan mock por diseño — las keys reales son solo para desarrollo y nunca se publican en el bundle.

## Qué hace

| Capacidad | Descripción |
|-----------|-------------|
| `fixtures` | Próximo fixture y resultados recientes por equipo (solo Primera A) |
| `match-prediction` | Resultado 1X2 con probabilidad, explicado en español ("Gana Atlético Nacional (48%)"), con modelo híbrido Poisson + Elo |
| `prediction-history` | Últimas 5 predicciones validadas contra los resultados reales al tiempo completo, guardadas en `localStorage` (sin cuentas, sin backend) |

Una predicción **acierta** cuando el resultado real al tiempo completo coincide con el predicho (1X2) — no el marcador exacto.

## Arquitectura

Clean, separada por capas — `domain/` (lógica pura), `application/` (casos de uso, puertos DI), `infrastructure/` (adaptadores de API, caché, localStorage), `ui/` (presentación).

## Estructura

```
src/
├── domain/              # Tipos, errores, predictor y reconciliación (sin I/O)
│   ├── football/        # model (Fixture, MatchResult), errors
│   └── prediction/      # strengths, poisson, predictor, language (español)
│   └── history/         # reconcile / countHistory (acierto hit/miss/pending)
├── application/         # Casos de uso con inyección de dependencias
│   ├── data/ports.ts    # TeamRepository, FixtureRepository
│   ├── useCases.ts      # football
│   └── historyUseCase.ts# recordPrediction, reconcileHistory, readHistory
├── infrastructure/      # Adaptadores: API-Football, caché first, mock, TheSportsDB
│   ├── api-football/    # Zod schemas, client, repositories, cache-first
│   ├── cache/           # ttlCache, dailyBudget
│   ├── mock/            # Fuente simulada (liga 239)
│   ├── thesportsdb/     # crestClient
│   └── historyRepository.ts  # localStorage (corrupt-safe, dedupe)
├── ui/                  # Presentación React + Tailwind
│   ├── TeamGrid, TeamCard, NextMatchCard, PredictionPanel, HistorySection
│   └── hooks/           # useTeams, useFixtures, usePrediction, useHistory
├── app/                 # Composition root: App, queryClient, selección de fuente
└── store/               # Zustand: selección de equipo
```

## Capacidades implementadas

- [x] **Catálogo de equipos** — escudos con grid responsive 2/4/6 columnas; estados cargando / error + reintentar / vacío
- [x] **Predicción 1X2** — modelo determinista Poisson + Elo con salida en español natural (nunca notación cruda 1X2)
- [x] **Fuente de datos configurable** — con key usa API-Football; sin key usa la fuente simulada (liga 239)
- [x] **Límite de cuota (100 req/día)** — caché-first con ventanas TTL (equipos 24h, fixtures+resultados 15min, escudos 30d) y guard de presupuesto diario que falla rápido
- [x] **Validación y errores tipados** — Zod en el borde; `ValidationError`, `ApiRateLimitError`
- [x] **Historial** — predice acertar/no/aciertar/pendiente de las últimas 5, con `H/(H+M)`; usa `localStorage` a prueba de corrupción
- [x] **Flujo responsive completo** — grid → selección → panel de predicción → historial

## Seguridad (claves API)

Las claves nunca llevan prefijo `VITE_` (Vite solo inyecta en el bundle público las `VITE_*`), se guardan en `.env` ignorado en git con permisos `0600`, y `scripts/manage-keys.mjs verify` comprueba que ninguna clave se filtre en `dist/` (sale con código ≠ 0 si algo falla).

## Estándares del proyecto

Sigue una checklist personal (ver `guia-practicas-esenciales`): nombres que explican la intención, una responsabilidad por función, fallo rápido con errores tipados, sin `any`/`@ts-ignore`, DRY, separación de tipos de estado, componentes puros, estados explícitos de carga/error/vacío y tests de comportamiento (no de implementación).

## Comandos de calidad

```bash
npm test        # vitest
npm run typecheck  # TypeScript (strict)
npm run build      # tsc + vite build (validación real del frontend)
npm run keys:verify  # comprueba que no haya fugas de claves en dist/
```

## Notas de desarrollo

- `openspec/` guarda los artefactos SDD — el change archivado está en `openspec/changes/archive/2026-08-06-football-predictor/` y las specs de capacidad base en `openspec/specs/`.
- Convención de commits: conventional commits, una unidad de trabajo revisable por commit.
- Cada PR debe enlazar un issue aprobado y llevar exactamente una etiqueta `type:*`.