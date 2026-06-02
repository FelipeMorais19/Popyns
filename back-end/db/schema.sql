-- =============================================================================
-- POPYNS — Schema inicial (MVP)
-- Banco: PostgreSQL gerenciado pelo Supabase
-- Auth:  Clerk (Third-Party Auth) — JWT do Clerk passa o clerk_user_id no claim "sub"
-- Geo:   PostGIS para consultas "perto de mim"
--
-- Como aplicar:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Cole este arquivo INTEIRO
--   3. Run
--
-- Idempotente: pode rodar de novo sem quebrar (usa IF NOT EXISTS / DO $$ blocks).
-- =============================================================================


-- =============================================================================
-- 1. EXTENSÕES
-- =============================================================================
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "postgis";    -- geography(POINT, 4326), ST_DWithin
create extension if not exists "citext";     -- email case-insensitive


-- =============================================================================
-- 2. HELPER — pega o clerk_user_id do JWT que o Clerk envia ao Supabase
-- =============================================================================
-- O Clerk envia um JWT cujo claim "sub" é o ID do usuário no Clerk
-- (ex: "user_2abc..."). Essa função extrai esse valor e é usada em todas as
-- políticas de RLS. Se não houver JWT (request anônimo), retorna NULL.
create or replace function public.clerk_user_id()
returns text
language sql stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
      ''
    ),
    ''
  );
$$;


-- =============================================================================
-- 3. ENUMS (tipos de domínio)
-- =============================================================================
do $$ begin
  create type booking_mode      as enum ('now', 'scheduled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status    as enum (
    'pending',      -- criado, aguardando profissional aceitar
    'accepted',     -- profissional aceitou
    'on_the_way',   -- saiu para o local
    'in_progress',  -- chegou e está atendendo
    'completed',    -- atendimento finalizado
    'cancelled',    -- cancelado por cliente ou profissional
    'rejected',     -- profissional recusou ou tempo de aceite estourou
    'expired'       -- expirou sem resposta (ex: pedido "agora" sem profissional)
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method    as enum ('pix', 'card', 'cash');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_kind as enum (
    'booking_created',
    'booking_accepted',
    'booking_on_the_way',
    'booking_arrived',
    'booking_completed',
    'booking_cancelled',
    'review_received',
    'badge_granted',
    'system'
  );
exception when duplicate_object then null; end $$;


-- =============================================================================
-- 4. TRIGGER GENÉRICO — atualiza updated_at automaticamente
-- =============================================================================
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- =============================================================================
-- 5. TABELAS
-- =============================================================================

-- -------------------------------------------------------------------
-- 5.1 users — perfil canônico, sincronizado via webhook do Clerk
-- -------------------------------------------------------------------
create table if not exists public.users (
  id                       uuid primary key default gen_random_uuid(),
  clerk_user_id            text unique not null,              -- "user_2abc..."
  email                    citext unique not null,
  full_name                text,
  phone                    text,
  avatar_url               text,
  is_professional          boolean not null default false,    -- dual-mode (Seção 2.3 do produto)
  preferred_payment_method payment_method,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists users_clerk_user_id_idx on public.users (clerk_user_id);
create index if not exists users_is_professional_idx on public.users (is_professional) where is_professional = true;

drop trigger if exists tg_users_updated_at on public.users;
create trigger tg_users_updated_at
  before update on public.users
  for each row execute function public.tg_set_updated_at();


-- -------------------------------------------------------------------
-- 5.2 addresses — múltiplos endereços por cliente (Casa, Trabalho, Outro)
-- -------------------------------------------------------------------
create table if not exists public.addresses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  label        text not null,                       -- "Casa", "Trabalho", "Mãe"
  street       text not null,
  number       text,
  complement   text,
  neighborhood text,
  city         text not null,
  state        text not null,
  postal_code  text,
  -- ponto geográfico em WGS84 (lat/lng padrão GPS)
  location     geography(point, 4326),
  is_default   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists addresses_user_id_idx  on public.addresses (user_id);
create index if not exists addresses_location_idx on public.addresses using gist (location);
-- só um endereço padrão por usuário
create unique index if not exists addresses_one_default_per_user_uq
  on public.addresses (user_id) where is_default = true;

drop trigger if exists tg_addresses_updated_at on public.addresses;
create trigger tg_addresses_updated_at
  before update on public.addresses
  for each row execute function public.tg_set_updated_at();


-- -------------------------------------------------------------------
-- 5.3 professional_profiles — extensão de users para quem é profissional
-- -------------------------------------------------------------------
create table if not exists public.professional_profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references public.users(id) on delete cascade,
  bio                   text,
  cover_url             text,
  base_city             text,
  base_state            text,

  -- modo "online" (recebe pedidos "Agora")
  is_online             boolean not null default false,
  service_radius_km     integer not null default 5 check (service_radius_km between 1 and 50),

  -- última localização reportada (para matching "Agora")
  current_location      geography(point, 4326),
  last_location_update  timestamptz,

  -- métricas (denormalizadas, atualizadas por trigger ou job)
  total_jobs            integer not null default 0,
  average_rating        numeric(3,2) not null default 0,    -- 0.00 a 5.00
  total_ratings         integer not null default 0,

  -- comissão atual, recalculada conforme conquista de selos (20% a 30%)
  commission_rate       numeric(4,3) not null default 0.300 check (commission_rate between 0 and 1),

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists prof_profiles_user_id_idx
  on public.professional_profiles (user_id);
create index if not exists prof_profiles_online_location_idx
  on public.professional_profiles using gist (current_location)
  where is_online = true;
create index if not exists prof_profiles_rating_idx
  on public.professional_profiles (average_rating desc, total_jobs desc);

drop trigger if exists tg_prof_profiles_updated_at on public.professional_profiles;
create trigger tg_prof_profiles_updated_at
  before update on public.professional_profiles
  for each row execute function public.tg_set_updated_at();


-- -------------------------------------------------------------------
-- 5.4 badges — catálogo dos 5 selos POPYNS
-- -------------------------------------------------------------------
create table if not exists public.badges (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text not null,
  icon        text,                                    -- nome do ícone no front
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);


-- -------------------------------------------------------------------
-- 5.5 professional_badges — selos conquistados por cada profissional
-- -------------------------------------------------------------------
create table if not exists public.professional_badges (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  badge_id        uuid not null references public.badges(id) on delete restrict,
  granted_at      timestamptz not null default now(),
  granted_by      text,                                -- clerk_user_id do admin (futuro)
  notes           text,
  unique (professional_id, badge_id)
);

create index if not exists prof_badges_professional_idx on public.professional_badges (professional_id);
create index if not exists prof_badges_badge_idx        on public.professional_badges (badge_id);


-- -------------------------------------------------------------------
-- 5.6 service_categories — Manicure, Cabelo, Maquiagem, etc.
-- -------------------------------------------------------------------
create table if not exists public.service_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  icon        text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);


-- -------------------------------------------------------------------
-- 5.7 services — serviços que cada profissional oferece (com preço próprio)
-- -------------------------------------------------------------------
create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid not null references public.professional_profiles(id) on delete cascade,
  category_id      uuid not null references public.service_categories(id) on delete restrict,
  name             text not null,                       -- "Manicure em gel"
  description      text,
  price_cents      bigint not null check (price_cents >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists services_professional_idx on public.services (professional_id) where is_active = true;
create index if not exists services_category_idx     on public.services (category_id)     where is_active = true;

drop trigger if exists tg_services_updated_at on public.services;
create trigger tg_services_updated_at
  before update on public.services
  for each row execute function public.tg_set_updated_at();


-- -------------------------------------------------------------------
-- 5.8 bookings — pedido de atendimento (núcleo do app)
-- -------------------------------------------------------------------
create table if not exists public.bookings (
  id                       uuid primary key default gen_random_uuid(),
  client_id                uuid not null references public.users(id) on delete restrict,
  professional_id          uuid references public.professional_profiles(id) on delete restrict,
  -- ⬆ pode ser NULL quando mode='now' e ainda buscando profissional
  address_id               uuid references public.addresses(id) on delete set null,
  -- snapshot do endereço (para preservar histórico mesmo se o endereço for editado/apagado)
  address_snapshot         jsonb not null,
  location                 geography(point, 4326) not null,

  mode                     booking_mode not null,
  scheduled_at             timestamptz,                       -- só quando mode='scheduled'
  status                   booking_status not null default 'pending',

  total_cents              bigint not null check (total_cents >= 0),
  total_duration_minutes   integer not null check (total_duration_minutes > 0),

  payment_method           payment_method not null,
  observation              text,                              -- "prefiro tons nudes"

  -- comissão SNAPSHOT no momento do booking (não muda se a comissão da profissional mudar depois)
  commission_rate          numeric(4,3) not null,
  commission_cents         bigint not null check (commission_cents >= 0),
  net_to_professional_cents bigint not null check (net_to_professional_cents >= 0),

  -- timestamps de cada transição (para SLAs e análise)
  accepted_at              timestamptz,
  on_the_way_at            timestamptz,
  arrived_at               timestamptz,
  started_at               timestamptz,
  completed_at             timestamptz,
  cancelled_at             timestamptz,
  cancellation_reason      text,
  cancelled_by             uuid references public.users(id),

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- regras de integridade
  constraint bookings_scheduled_has_date check (
    (mode = 'scheduled' and scheduled_at is not null) or
    (mode = 'now'       and scheduled_at is null)
  )
);

create index if not exists bookings_client_idx          on public.bookings (client_id, created_at desc);
create index if not exists bookings_professional_idx   on public.bookings (professional_id, created_at desc);
create index if not exists bookings_status_idx          on public.bookings (status);
create index if not exists bookings_scheduled_at_idx   on public.bookings (scheduled_at) where mode = 'scheduled';
create index if not exists bookings_location_idx        on public.bookings using gist (location);

drop trigger if exists tg_bookings_updated_at on public.bookings;
create trigger tg_bookings_updated_at
  before update on public.bookings
  for each row execute function public.tg_set_updated_at();


-- -------------------------------------------------------------------
-- 5.9 booking_services — itens do pedido (pode ter vários serviços no mesmo)
-- -------------------------------------------------------------------
create table if not exists public.booking_services (
  id                       uuid primary key default gen_random_uuid(),
  booking_id               uuid not null references public.bookings(id) on delete cascade,
  service_id               uuid references public.services(id) on delete set null,
  -- snapshots (preservam o pedido mesmo se a profissional alterar preço/nome do serviço depois)
  name_snapshot            text   not null,
  price_cents_snapshot     bigint not null,
  duration_minutes_snapshot integer not null,
  -- checklist em atendimento (Seção 4.2 do produto)
  is_done                  boolean not null default false,
  done_at                  timestamptz,
  created_at               timestamptz not null default now()
);

create index if not exists booking_services_booking_idx on public.booking_services (booking_id);


-- -------------------------------------------------------------------
-- 5.10 booking_status_events — histórico/auditoria das transições
-- -------------------------------------------------------------------
create table if not exists public.booking_status_events (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  status      booking_status not null,
  notes       text,
  actor_id    uuid references public.users(id),
  created_at  timestamptz not null default now()
);

create index if not exists booking_status_events_booking_idx
  on public.booking_status_events (booking_id, created_at);


-- -------------------------------------------------------------------
-- 5.11 reviews — avaliação 1-1 com booking concluído
-- -------------------------------------------------------------------
create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null unique references public.bookings(id) on delete cascade,
  client_id       uuid not null references public.users(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  rating          integer not null check (rating between 1 and 5),
  comment         text,
  tags            text[] not null default '{}',     -- ["pontual","caprichada","higienica"]
  created_at      timestamptz not null default now()
);

create index if not exists reviews_professional_idx on public.reviews (professional_id, created_at desc);
create index if not exists reviews_client_idx       on public.reviews (client_id, created_at desc);


-- Trigger: ao inserir review, recalcula average_rating e total_ratings da profissional
create or replace function public.tg_recalc_professional_rating()
returns trigger
language plpgsql
as $$
begin
  update public.professional_profiles pp
  set
    total_ratings  = (select count(*) from public.reviews r where r.professional_id = pp.id),
    average_rating = coalesce(
      (select round(avg(rating)::numeric, 2) from public.reviews r where r.professional_id = pp.id),
      0
    )
  where pp.id = new.professional_id;
  return new;
end;
$$;

drop trigger if exists tg_reviews_recalc on public.reviews;
create trigger tg_reviews_recalc
  after insert or update or delete on public.reviews
  for each row execute function public.tg_recalc_professional_rating();


-- -------------------------------------------------------------------
-- 5.12 favorites — cliente favorita profissional
-- -------------------------------------------------------------------
create table if not exists public.favorites (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.users(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (client_id, professional_id)
);

create index if not exists favorites_client_idx       on public.favorites (client_id);
create index if not exists favorites_professional_idx on public.favorites (professional_id);


-- -------------------------------------------------------------------
-- 5.13 notifications — feed de notificações in-app
-- -------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  kind       notification_kind not null,
  title      text not null,
  body       text,
  data       jsonb not null default '{}',           -- payload arbitrário (booking_id, etc)
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc) where read_at is null;
create index if not exists notifications_user_all_idx
  on public.notifications (user_id, created_at desc);


-- =============================================================================
-- 6. RLS — ATIVAR EM TODAS AS TABELAS
-- =============================================================================
alter table public.users                  enable row level security;
alter table public.addresses              enable row level security;
alter table public.professional_profiles  enable row level security;
alter table public.badges                 enable row level security;
alter table public.professional_badges    enable row level security;
alter table public.service_categories     enable row level security;
alter table public.services               enable row level security;
alter table public.bookings               enable row level security;
alter table public.booking_services       enable row level security;
alter table public.booking_status_events  enable row level security;
alter table public.reviews                enable row level security;
alter table public.favorites              enable row level security;
alter table public.notifications          enable row level security;


-- =============================================================================
-- 7. POLICIES
-- Convenção: clerk_user_id() = JWT.sub do Clerk; cruza com users.clerk_user_id
-- =============================================================================

-- ---- users ----
drop policy if exists "users_select_own"    on public.users;
drop policy if exists "users_select_public" on public.users;
drop policy if exists "users_update_own"    on public.users;

-- vê o próprio perfil completo
create policy "users_select_own"
  on public.users for select
  using (clerk_user_id = public.clerk_user_id());

-- qualquer logado pode ver dados públicos de profissionais (a vitrine)
create policy "users_select_public"
  on public.users for select
  using (is_professional = true and public.clerk_user_id() is not null);

-- atualiza só o próprio
create policy "users_update_own"
  on public.users for update
  using (clerk_user_id = public.clerk_user_id())
  with check (clerk_user_id = public.clerk_user_id());

-- INSERT em users é feito pelo webhook Clerk → API com service_role (bypassa RLS).


-- ---- addresses ----
drop policy if exists "addresses_owner_all" on public.addresses;
create policy "addresses_owner_all"
  on public.addresses for all
  using (
    user_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
  )
  with check (
    user_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
  );


-- ---- professional_profiles ----
drop policy if exists "prof_profiles_select_public" on public.professional_profiles;
drop policy if exists "prof_profiles_update_own"    on public.professional_profiles;

-- vitrine: qualquer logado vê
create policy "prof_profiles_select_public"
  on public.professional_profiles for select
  using (public.clerk_user_id() is not null);

-- profissional edita o próprio
create policy "prof_profiles_update_own"
  on public.professional_profiles for update
  using (
    user_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
  )
  with check (
    user_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
  );


-- ---- badges (catálogo público leitura) ----
drop policy if exists "badges_select_all" on public.badges;
create policy "badges_select_all"
  on public.badges for select
  using (true);


-- ---- professional_badges (leitura pública, escrita só admin via service_role) ----
drop policy if exists "prof_badges_select_all" on public.professional_badges;
create policy "prof_badges_select_all"
  on public.professional_badges for select
  using (true);


-- ---- service_categories ----
drop policy if exists "categories_select_all" on public.service_categories;
create policy "categories_select_all"
  on public.service_categories for select
  using (true);


-- ---- services ----
drop policy if exists "services_select_public" on public.services;
drop policy if exists "services_owner_write"   on public.services;

create policy "services_select_public"
  on public.services for select
  using (is_active = true or
    professional_id in (
      select pp.id from public.professional_profiles pp
      join public.users u on u.id = pp.user_id
      where u.clerk_user_id = public.clerk_user_id()
    )
  );

create policy "services_owner_write"
  on public.services for all
  using (
    professional_id in (
      select pp.id from public.professional_profiles pp
      join public.users u on u.id = pp.user_id
      where u.clerk_user_id = public.clerk_user_id()
    )
  )
  with check (
    professional_id in (
      select pp.id from public.professional_profiles pp
      join public.users u on u.id = pp.user_id
      where u.clerk_user_id = public.clerk_user_id()
    )
  );


-- ---- bookings ----
drop policy if exists "bookings_select_participant" on public.bookings;
drop policy if exists "bookings_client_insert"      on public.bookings;
drop policy if exists "bookings_update_participant" on public.bookings;

-- cliente OU profissional do booking conseguem ler
create policy "bookings_select_participant"
  on public.bookings for select
  using (
    client_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
    or
    professional_id in (
      select pp.id from public.professional_profiles pp
      join public.users u on u.id = pp.user_id
      where u.clerk_user_id = public.clerk_user_id()
    )
  );

-- cliente cria o próprio booking
create policy "bookings_client_insert"
  on public.bookings for insert
  with check (
    client_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
  );

-- transições de status — cliente OU profissional do booking podem atualizar
-- (a lógica de quais transições são válidas é aplicada em camada de API/serviço)
create policy "bookings_update_participant"
  on public.bookings for update
  using (
    client_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
    or
    professional_id in (
      select pp.id from public.professional_profiles pp
      join public.users u on u.id = pp.user_id
      where u.clerk_user_id = public.clerk_user_id()
    )
  );


-- ---- booking_services ----
drop policy if exists "booking_services_participant" on public.booking_services;
create policy "booking_services_participant"
  on public.booking_services for all
  using (
    booking_id in (
      select b.id from public.bookings b
      where
        b.client_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
        or
        b.professional_id in (
          select pp.id from public.professional_profiles pp
          join public.users u on u.id = pp.user_id
          where u.clerk_user_id = public.clerk_user_id()
        )
    )
  )
  with check (
    booking_id in (
      select b.id from public.bookings b
      where
        b.client_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
        or
        b.professional_id in (
          select pp.id from public.professional_profiles pp
          join public.users u on u.id = pp.user_id
          where u.clerk_user_id = public.clerk_user_id()
        )
    )
  );


-- ---- booking_status_events ----
drop policy if exists "booking_events_participant" on public.booking_status_events;
create policy "booking_events_participant"
  on public.booking_status_events for select
  using (
    booking_id in (
      select b.id from public.bookings b
      where
        b.client_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
        or
        b.professional_id in (
          select pp.id from public.professional_profiles pp
          join public.users u on u.id = pp.user_id
          where u.clerk_user_id = public.clerk_user_id()
        )
    )
  );


-- ---- reviews ----
drop policy if exists "reviews_select_public" on public.reviews;
drop policy if exists "reviews_client_insert" on public.reviews;

create policy "reviews_select_public"
  on public.reviews for select
  using (true);                                          -- avaliações são públicas (vitrine)

create policy "reviews_client_insert"
  on public.reviews for insert
  with check (
    client_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
  );


-- ---- favorites ----
drop policy if exists "favorites_owner_all" on public.favorites;
create policy "favorites_owner_all"
  on public.favorites for all
  using (
    client_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
  )
  with check (
    client_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
  );


-- ---- notifications ----
drop policy if exists "notifications_owner_select" on public.notifications;
drop policy if exists "notifications_owner_update" on public.notifications;

create policy "notifications_owner_select"
  on public.notifications for select
  using (
    user_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
  );

-- só permitir marcar como lida (UPDATE do read_at) — INSERT é via service_role
create policy "notifications_owner_update"
  on public.notifications for update
  using (
    user_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
  )
  with check (
    user_id in (select id from public.users where clerk_user_id = public.clerk_user_id())
  );


-- =============================================================================
-- 8. SEEDS — catálogos iniciais
-- =============================================================================

-- Selos POPYNS (Seção 5 da Visão de Produto)
insert into public.badges (slug, name, description, icon, sort_order) values
  ('verificada',    'Verificada',    'Documento e CPF conferidos pela POPYNS',                       'shield-check',  1),
  ('antecedentes',  'Antecedentes',  'Análise minuciosa de antecedentes criminais',                  'file-search',   2),
  ('treinamento',   'Treinamento',   'Curso interno de higiene, postura e atendimento',              'graduation-cap',3),
  ('pontual',       'Pontual',       '95%+ dos atendimentos no horário (últimos 60 dias)',           'clock',         4),
  ('top_avaliada',  'Top Avaliada',  'Média ≥ 4.8 com 50+ avaliações',                                'star',          5)
on conflict (slug) do nothing;


-- Categorias de serviço (Seção 7 da Visão de Produto)
insert into public.service_categories (slug, name, icon, sort_order) values
  ('manicure_pedicure', 'Manicure / Pedicure', 'hand',         1),
  ('cabelo',            'Cabelo',              'scissors',     2),
  ('maquiagem',         'Maquiagem',           'lipstick',     3),
  ('depilacao',         'Depilação',           'sparkles',     4),
  ('sobrancelha_cilios','Sobrancelha / Cílios','eye',          5),
  ('massagem_estetica', 'Massagem / Estética', 'lotus',        6),
  ('limpeza_domestica', 'Limpeza Doméstica',   'broom',        7)
on conflict (slug) do nothing;


-- =============================================================================
-- FIM
-- =============================================================================
