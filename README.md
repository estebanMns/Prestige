# Perfumería Prestige

Tienda en línea de Perfumería Prestige. Incluye catálogo de perfumes de nicho, diseñador y árabes, un frasco 3D en la portada y un asesor virtual con IA. Los pedidos se envían por WhatsApp. El panel de administración está protegido con JWT, Argon2id y verificación en dos pasos.

**Stack:** Next.js 15 (App Router) · TypeScript estricto · PostgreSQL (pg, SQL puro) · jose (JWT) · Argon2id · TOTP · Zod · Tailwind CSS 4 · React Three Fiber · Zustand · Vitest.

---

## 1. Puesta en marcha (desarrollo)

Requisitos: Node.js 20.18 o superior y Docker (para PostgreSQL).

```bash
npm install
# Crea un archivo .env con las variables de la tabla de abajo (no se versiona).
# Genera JWT_ACCESS_SECRET con: openssl rand -base64 48
docker compose up -d              # PostgreSQL local
npm run db:migrate              # aplica las migraciones SQL (db/migrations)
npm run db:seed                   # crea los administradores (y el catálogo de ejemplo si SEED_SAMPLE_CATALOG=true)
npm run dev                       # http://localhost:3000
```

### Variables de entorno

Todas se leen y validan al arrancar en `src/infrastructure/config/AppConfig.ts`. Los valores secretos nunca van en el código ni en el repositorio.

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `NODE_ENV` | No | `development`, `test` o `production`. |
| `APP_URL` | No | URL pública de la tienda. |
| `DATABASE_URL` | Sí | Conexión a PostgreSQL. Formato `postgresql://usuario:clave@host:puerto/base`. Con `?sslmode=require` la conexión usa SSL. |
| `DATABASE_SSL_CA_FILE` | Si usas SSL en RDS | Ruta al bundle de certificados de AWS (`global-bundle.pem`) para verificar el servidor. |
| `JWT_ACCESS_SECRET` | Sí | Secreto para firmar los tokens de sesión. Mínimo 32 caracteres. |
| `JWT_ISSUER` / `JWT_AUDIENCE` | No | Emisor y audiencia de los tokens. |
| `JWT_ACCESS_TTL_SECONDS` | No | Duración del token de acceso (60 a 3600). |
| `REFRESH_TOKEN_TTL_DAYS` | No | Duración de la sesión (1 a 30 días). |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_LOCK_MINUTES` | No | Intentos antes de bloquear una cuenta y minutos de bloqueo. |
| `TOTP_ISSUER` | No | Nombre que aparece en la app autenticadora. |
| `STORAGE_DRIVER` | No | `local` (solo desarrollo) o `s3`. |
| `S3_BUCKET` / `S3_REGION` / `S3_PUBLIC_BASE_URL` | Si usas S3 | Bucket de fotos y su dominio público. |
| `NEXT_PUBLIC_IMAGE_HOST` / `NEXT_PUBLIC_UPLOAD_HOST` | Si usas S3 | Dominios de imágenes y de subida, incluidos en la CSP al compilar. |
| `XAI_API_KEY` / `XAI_MODEL` | No | Asesor con Grok. Si falta la clave, se usa el siguiente proveedor. |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | No | Asesor con Claude. Se usa si no hay clave de Grok. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Para el seed | Primer administrador. |
| `SEED_ADMIN2_EMAIL` / `SEED_ADMIN2_PASSWORD` | Para el seed | Segundo administrador. |
| `SEED_ADMIN_RESET_PASSWORD` | No | `true` para aplicar las contraseñas del `.env` a administradores que ya existen. |
| `POSTGRES_PORT` | No | Puerto del PostgreSQL de `docker-compose.yml` (5432 por defecto). |

Si ninguna clave de IA está definida, el asesor responde con búsqueda por palabras clave en el catálogo, sin costo.

El panel está en **/admin/login**. Los administradores son los que definiste en `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` y `SEED_ADMIN2_EMAIL` / `SEED_ADMIN2_PASSWORD`. Ninguna credencial está en el código: todo sale del `.env`.

- **Si cambias una contraseña en el `.env`**, aplícala con `SEED_ADMIN_RESET_PASSWORD=true npm run db:seed`. Sin esa variable, el seed no toca a administradores que ya existen, para no revertir cambios hechos desde el panel.
- Al entrar por primera vez: cambia la contraseña en **Seguridad** y activa la verificación en dos pasos.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm test` | Pruebas unitarias (dominio, casos de uso, JWT) |
| `npm run typecheck` | Verificación de tipos |
| `npm run lint` | ESLint (incluye la regla que protege la arquitectura) |

---

## 2. Arquitectura

El proyecto usa **arquitectura limpia (hexagonal)**. Las dependencias siempre apuntan hacia el centro: el núcleo de negocio no conoce Next.js, pg ni ningún servicio externo.

```
src/
├── core/                         ← NÚCLEO: TypeScript puro, sin frameworks
│   ├── domain/                   ← Reglas de negocio
│   │   ├── shared/               Entity, DomainError, Guard, Money, Email, PhoneNumber, Slug
│   │   ├── perfume/              Perfume (agregado raíz), Presentation, enums
│   │   ├── user/                 User (bloqueo por intentos, 2FA), Role + RolePolicy
│   │   ├── auth/                 RefreshToken (rotación), Actor
│   │   ├── order/                Order (pedido que se envía por WhatsApp)
│   │   ├── settings/             StoreSettings
│   │   └── audit/                AuditEntry
│   └── application/              ← Casos de uso (una operación por clase)
│       ├── ports/                Interfaces: repositorios y servicios que el núcleo necesita
│       ├── services/             SessionIssuer, AuthorizationService, PasswordPolicy, WhatsAppOrderMessage
│       ├── dto/                  PerfumeDTO + PerfumePresenter
│       └── use-cases/            auth/, perfumes/, orders/, settings/, chat/, audit/
│
├── infrastructure/               ← ADAPTADORES: implementan los puertos
│   ├── persistence/postgres/     Repositorios con SQL (pg) + mappers fila ⇄ entidad
│   ├── security/                 Argon2PasswordHasher, AccessTokenCodec (jose), TOTP, rate limiter
│   ├── storage/                  S3FileStorage (producción), LocalFileStorage (desarrollo)
│   ├── ai/                       AnthropicChatAssistant, KeywordChatAssistant (respaldo)
│   ├── config/                   AppConfig: variables de entorno validadas con Zod
│   └── di/Container.ts           Raíz de composición (inyección de dependencias)
│
├── presentation/                 ← ENTRADA/SALIDA
│   ├── http/                     Controladores, esquemas Zod, mapeo de errores, cookies de sesión
│   ├── server/                   Lectura de sesión y datos en componentes de servidor
│   └── ui/                       Componentes React (tienda y panel), estado (Zustand), ApiClient
│
├── app/                          ← Rutas de Next.js (solo conectan URL → controlador o página)
└── middleware.ts                 ← Primera barrera: JWT y protección CSRF
```

### Cómo fluye una petición

```
Navegador → middleware.ts (JWT/CSRF) → app/api/.../route.ts → Controller (valida con Zod)
          → UseCase (reglas + permisos) → Entidades del dominio → Puerto (interfaz)
          → Adaptador (PostgreSQL / S3 / Argon2 / Claude) → respuesta → HttpErrorMapper si hubo error
```

### Principios aplicados

- **Responsabilidad única:** cada clase tiene un solo motivo para cambiar.
  - `LoginUseCase` solo autentica.
  - `SessionIssuer` solo emite tokens.
  - `WhatsAppOrderMessage` solo da formato al mensaje.
  - `PerfumeMapper` solo traduce entre la base de datos y el dominio.
- **Abierto/cerrado:** puedes agregar un rol o un permiso sin tocar los casos de uso, porque se cambia solo en `RolePolicy`. Lo mismo con un almacenamiento nuevo (Azure Blob, por ejemplo): se crea otra clase que implemente `FileStorage`.
- **Sustitución de Liskov:** `LocalFileStorage` y `S3FileStorage` son intercambiables, igual que `AnthropicChatAssistant` y `KeywordChatAssistant`.
- **Segregación de interfaces:** los puertos son pequeños y específicos: `PasswordHasher`, `TotpService`, `RateLimiter`, `Clock`…
- **Inversión de dependencias:** los casos de uso reciben interfaces por constructor. Solo `Container.ts` conoce las clases concretas.
- **Encapsulamiento:** las entidades protegen sus invariantes. Un `Perfume` no puede existir sin presentaciones, y un `User` decide él mismo cuándo se bloquea.
- **Value objects:** `Money` usa pesos enteros (sin errores de redondeo), `Email` y `PhoneNumber` se validan y normalizan, y `Slug` genera URLs sin tildes.
- **La arquitectura se hace cumplir:** ESLint prohíbe que `src/core` importe Next.js, React, pg u otras capas.

---

## 3. Seguridad

| Capa | Medida |
|---|---|
| **Sesión** | JWT de acceso HS256 de 15 min (`jose`), con `iss`, `aud`, `exp`, `nbf` y `jti`. Refresh token opaco de 7 días, guardado como SHA-256. |
| **Rotación** | Cada renovación revoca el refresh token usado. Si un token ya usado reaparece (posible robo), se revoca toda la sesión y queda en la auditoría. |
| **Cookies** | `httpOnly`, `Secure` (producción) y `SameSite=Strict`. El refresh token solo viaja a `/api/auth`. Nada se guarda en `localStorage`. |
| **CSRF** | SameSite=Strict, y el middleware rechaza POST/PUT/DELETE de otro origen. |
| **Rutas protegidas** | El middleware verifica el JWT antes de llegar a `/admin` y `/api/admin`. Cada caso de uso vuelve a comprobar el permiso del rol (defensa en profundidad). |
| **Contraseñas** | Argon2id con los parámetros recomendados por OWASP. Mínimo 12 caracteres con mayúsculas, minúsculas y números. Al cambiarla se cierran todas las sesiones. |
| **Fuerza bruta** | Límite de intentos por IP y bloqueo de la cuenta tras 5 fallos (configurable). Misma respuesta si el correo no existe, con tiempo igualado. |
| **Doble factor** | TOTP compatible con Google y Microsoft Authenticator, con activación por código QR. |
| **Roles** | `ADMIN` puede todo. `ASESOR` crea y edita perfumes y sube fotos, pero no borra ni cambia ajustes. |
| **Pedidos** | El servidor recalcula los precios con el catálogo: el navegador solo envía qué producto y cuántas unidades. |
| **Entradas** | Todo cuerpo JSON se valida con Zod. Las reglas de negocio se validan en el dominio. |
| **Fotos** | Subida directa a S3 con URL firmada de 5 min. Solo JPG, PNG o WEBP de hasta 5 MB, con nombre generado por el servidor. |
| **Cabeceras** | CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`. |
| **Redirecciones** | Solo se aceptan destinos internos de `/admin` (sin redirecciones abiertas). |
| **Auditoría** | Se registran logins, fallos, bloqueos, cambios de contraseña y creación, edición y borrado de perfumes. Se consultan en **Seguridad**. |
| **Configuración** | Variables validadas al arrancar. Los secretos van en AWS Secrets Manager o Azure Key Vault. |

---

## 4. Despliegue

La imagen Docker (`Dockerfile`) usa la salida *standalone* de Next.js y corre como usuario sin privilegios.

### AWS

| Componente | Servicio |
|---|---|
| App | **App Runner** o **ECS Fargate** detrás de un ALB |
| Base de datos | **RDS PostgreSQL** (Multi-AZ en producción) |
| Fotos | Bucket **S3** privado + **CloudFront** (`STORAGE_DRIVER=s3`) |
| Secretos | **Secrets Manager** → `JWT_ACCESS_SECRET`, `DATABASE_URL`, `ANTHROPIC_API_KEY` |
| Permisos | Rol IAM de la tarea con `s3:PutObject` y `s3:DeleteObject` solo en el prefijo `perfumes/` |

El bucket necesita una regla CORS que permita `PUT` desde tu dominio. Configura `NEXT_PUBLIC_UPLOAD_HOST` con el dominio del bucket y `NEXT_PUBLIC_IMAGE_HOST` con el de CloudFront **antes de compilar**, porque la CSP se genera en la compilación.

### Azure

| Componente | Servicio |
|---|---|
| App | **Container Apps** o **App Service** (contenedores) |
| Base de datos | **Azure Database for PostgreSQL – Flexible Server** |
| Fotos | **Blob Storage** + **Front Door**. Crea `AzureBlobFileStorage` implementando la interfaz `FileStorage` con tokens SAS y regístralo en `Container.ts`. No hay que tocar nada más. |
| Secretos | **Key Vault** con identidad administrada |

### Antes de producción

- Ejecuta `npm run db:migrate:prod` en cada versión (aplica las migraciones a la base de AWS con `.env.rds`).
- Con varias instancias, reemplaza `InMemoryRateLimiter` por una versión sobre Redis (ElastiCache o Azure Cache). La interfaz `RateLimiter` ya está lista.
- Revisa los textos legales en `src/presentation/ui/content/helpPages.ts` con tu asesor jurídico.

---

## 5. Cómo extender

- **Un campo nuevo en el perfume:** agrégalo en una nueva migración en `db/migrations/`, en la fila de `PgPerfumeRepository` y `PerfumeMapper`, `Perfume.ts` (validación), `PerfumeMapper`, `PerfumeDTO`, `schemas.ts` y `PerfumeForm.tsx`.
- **Un rol nuevo:** agrégalo al tipo `user_role` en una migración y al tipo `Role`, y define sus permisos en `RolePolicy`.
- **Otra pasarela de mensajes o de pago:** crea un puerto en `application/ports` y su adaptador en `infrastructure`.
