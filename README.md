# op-rebote

> Aplicación web full-stack construida con **Next.js 15 App Router**, **TypeScript** y una **Arquitectura Hexagonal** (Puertos y Adaptadores) estricta. Herramienta de productividad personal para análisis de mercados financieros.

---

## Arquitectura

El proyecto aplica **Arquitectura Hexagonal** para mantener la lógica de dominio completamente aislada del framework, la base de datos y las APIs externas.

```
┌─────────────────────────────────────────────────┐
│                    DOMINIO                       │
│         models · rules · constants               │
│         TypeScript puro — cero dependencias      │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│              CAPA DE APLICACIÓN                  │
│    use-cases/              ports/                │
│    Orquesta la lógica      Define interfaces     │
└────────┬──────────────────────────┬─────────────┘
         │                          │
┌────────▼───────────┐   ┌──────────▼──────────────┐
│   Adaptadores IN    │   │   Adaptadores OUT        │
│   (lado conductor)  │   │   (lado conducido)       │
│                     │   │                          │
│   app/actions/      │   │   infrastructure/        │
│   Server Actions    │   │   repositories/  ← BD    │
│                     │   │   yahoo-finance/ ← API   │
│   app/api/          │   │                          │
│   Route Handlers    │   │   Implementan los ports  │
│   (cron, REST)      │   │   definidos en app/      │
└─────────────────────┘   └──────────────────────────┘
```

> En Next.js, el propio framework actúa como **Adaptador IN** principal — las Server Actions y los Route Handlers son los puntos de entrada. Es una adaptación pragmática del patrón a las restricciones del framework.

### Decisiones de diseño

- **El dominio no tiene dependencias de framework.** `domain/` contiene TypeScript puro — sin React, sin Supabase, sin Next.js.
- **Los ports son interfaces, no implementaciones.** `application/ports/` define lo que los casos de uso necesitan; `infrastructure/` lo entrega. Cambiar Supabase por otra base de datos implica tocar solo el adaptador, nada más.
- **Los casos de uso son los orquestadores.** Contienen el flujo de negocio y son testables unitariamente sin levantar un servidor ni una base de datos.
- **Las Server Actions como controladores.** `app/actions/` son delgadas: validan la entrada, llaman a un caso de uso y devuelven el resultado. La lógica de negocio no se filtra ahí.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Lenguaje | TypeScript (modo estricto) |
| Estilos | Tailwind CSS v4 + constantes por componente |
| Base de datos | PostgreSQL vía Supabase |
| Datos externos | Yahoo Finance (REST + screener API) |
| Autenticación | Supabase Auth (protección de rutas vía middleware) |
| Despliegue | Vercel |
| Batch / Cron | Cloudflare Workers (cron trigger) → GitHub Actions → API Route — para evitar las limitaciones de ejecución de Vercel en tareas programadas |

---

## Estructura del proyecto

```
app/
  (dashboard)/          # Route groups — Server Components a nivel de página
  actions/              # Adaptadores IN — Server Actions (controladores finos)
  api/                  # Adaptadores IN — Route Handlers (cron, REST)

application/
  ports/                # Interfaces de los ports OUT (IXxxRepository)
  use-cases/            # Orquestación de negocio

domain/
  models/               # Tipos de datos y entidades puras
  rules/                # Reglas de negocio como funciones puras
  config/               # Configuración a nivel de dominio

infrastructure/
  repositories/         # Adaptadores OUT — implementaciones Supabase
  yahoo-finance/        # Adaptadores OUT — adaptador de datos de mercado

components/
  features/             # Componentes UI agrupados por feature (co-localizados)
  ui/                   # Primitivas del sistema de diseño compartido

context/                # React Context (estado exclusivamente en cliente)
styles/                 # Constantes de clases Tailwind compartidas (UI_STYLES)
tests/                  # Tests unitarios — reglas de dominio + mappers
```

---

## Principios aplicados

### Responsabilidad única
Cada fichero tiene un único motivo de cambio. Los componentes grandes se dividen en unidades con propósito concreto: columnas, celdas, filtros, resumen, estado vacío — cada uno en su propio fichero.

### Constantes en lugar de cadenas mágicas
Todo el texto de la UI vive en `domain/literales.constantes.ts` (`UI_TEXT`). Todas las clases Tailwind repetidas viven en `styles/ui-styles.ts` (`UI_STYLES`). Sin cadenas mágicas dispersas por los componentes.

### Dirección de dependencias
Las dependencias siempre apuntan **hacia adentro** — hacia el dominio. El dominio no sabe nada de Supabase, Next.js ni Yahoo Finance. La infraestructura conoce las interfaces del dominio (ports), nunca al revés.

---

## Tests

```
tests/
  domain/          # Tests de funciones puras — reglas, mappers
  infrastructure/  # Tests de integración de adaptadores (aislados)
```

Las reglas de dominio son funciones puras: reciben datos, devuelven un resultado, sin efectos secundarios. Eso las hace trivialmente testables sin mocks.

---

## Arranque local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build
```

---

## Lo que este proyecto no es

No es una aplicación de tutorial ni un CRUD con nombre llamativo. Conecta con APIs externas en tiempo real, ejecuta trabajos programados en segundo plano, aplica reglas de dominio reales y gestiona el estado a través de Server y Client Components en Next.js App Router — incluyendo las restricciones de la frontera RSC/cliente que eso conlleva.

---

*Desarrollado por [Tu Nombre](https://tu-portfolio.com)*
