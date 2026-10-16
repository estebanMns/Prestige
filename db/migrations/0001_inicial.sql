-- Esquema inicial de Perfumería Prestige.
-- Requiere PostgreSQL 13 o superior (gen_random_uuid viene integrado desde esa versión).

CREATE TYPE perfume_category AS ENUM ('NICHO', 'DISENADOR', 'ARABE');
CREATE TYPE gender AS ENUM ('HOMBRE', 'MUJER', 'UNISEX');
CREATE TYPE concentration AS ENUM ('EAU_DE_COLOGNE', 'EAU_DE_TOILETTE', 'EAU_DE_PARFUM', 'PARFUM', 'EXTRAIT_DE_PARFUM', 'ELIXIR');
CREATE TYPE product_type AS ENUM ('ORIGINAL', 'REPLICA_1_1');
CREATE TYPE user_role AS ENUM ('ADMIN', 'ASESOR');

CREATE TABLE perfumes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  name          text NOT NULL,
  house         text NOT NULL,
  category      perfume_category NOT NULL,
  gender        gender NOT NULL,
  concentration concentration NOT NULL,
  description   text NOT NULL DEFAULT '',
  notes_top     text NOT NULL DEFAULT '',
  notes_heart   text NOT NULL DEFAULT '',
  notes_base    text NOT NULL DEFAULT '',
  image_key     text,
  color         text NOT NULL DEFAULT '#c9a86a',
  featured      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX perfumes_category_gender_idx ON perfumes (category, gender);

CREATE TABLE presentations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfume_id uuid NOT NULL REFERENCES perfumes (id) ON DELETE CASCADE,
  ml         integer NOT NULL,
  type       product_type NOT NULL,
  price_cop  integer NOT NULL,
  in_stock   boolean NOT NULL DEFAULT true,
  UNIQUE (perfume_id, ml, type)
);

CREATE TABLE users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text NOT NULL UNIQUE,
  password_hash      varchar(255) NOT NULL,
  role               user_role NOT NULL DEFAULT 'ASESOR',
  totp_secret        text,
  totp_enabled       boolean NOT NULL DEFAULT false,
  failed_login_count integer NOT NULL DEFAULT 0,
  locked_until       timestamptz,
  last_login_at      timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Cada refresh token se guarda hasheado. family_id agrupa las rotaciones de una sesión.
CREATE TABLE refresh_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  family_id  uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_family_idx ON refresh_tokens (family_id);

CREATE TABLE audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   uuid,
  action     text NOT NULL,
  entity     text NOT NULL,
  entity_id  text,
  details    jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity, entity_id);

-- Configuración de la tienda: una sola fila con id = 1.
CREATE TABLE store_settings (
  id         integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  whatsapp   text NOT NULL DEFAULT '',
  email      text NOT NULL DEFAULT '',
  address    text NOT NULL DEFAULT '',
  hours      text NOT NULL DEFAULT '',
  instagram  text NOT NULL DEFAULT '',
  tiktok     text NOT NULL DEFAULT '',
  facebook   text NOT NULL DEFAULT '',
  about      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
