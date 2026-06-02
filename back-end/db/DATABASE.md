# POPYNS — Banco de Dados (Supabase + Clerk)

Documento explicativo do schema MVP. O SQL completo está em [`schema.sql`](./schema.sql) — este arquivo conta o **porquê** de cada decisão e como tudo se conecta.

---

## 1. Stack e papéis de cada peça

| Peça | Papel |
|---|---|
| **Clerk** | Único responsável pelo login, sessão, MFA, OAuth, recuperação de senha. Nunca guardamos senha no Supabase. |
| **Supabase Postgres** | Banco de dados de toda a aplicação (perfis, profissionais, bookings, reviews, etc). |
| **Supabase RLS** | Camada de segurança no banco. Cada linha sabe quem pode ler/escrever, mesmo se o front mandar uma query maliciosa. |
| **Clerk → Supabase Third-Party Auth** | Integração nativa: o Clerk emite um JWT que o cliente Supabase usa direto. O claim `sub` do JWT = `clerk_user_id`. |
| **PostGIS** | Extensão geográfica do Postgres. Usada pro mapa "profissionais perto de mim" e pra calcular distância. |
| **Webhook do Clerk** | Sincroniza criação/edição/exclusão de usuário do Clerk → tabela `users` do Supabase. Roda na nossa API com a `service_role` key (a única que bypassa RLS). |

### Por que esse arranjo?

- O Clerk já resolve auth bem — não faz sentido manter um sistema de senhas paralelo.
- O Supabase resolve banco + Realtime + Storage + Edge Functions com RLS — não faz sentido reimplementar.
- Com a integração nativa Clerk↔Supabase, o front-end (Next.js) chama o Supabase **direto**, e o RLS bloqueia tudo que o usuário logado não deveria ver. Sem necessidade de proxy de cada query através de uma API Node intermediária.
- Sobra pra **nossa API própria** (em `back-end/`) só o que **precisa** de service_role: webhooks do Clerk, jobs (recálculo de comissão, expiração de pedidos "Agora"), e lógica de negócio sensível (matching de profissional próximo, transições de status validadas).

---

## 2. Como o auth conecta o Clerk ao Supabase

```
┌──────────────┐       ┌────────────────┐       ┌──────────────┐
│   Next.js    │──JWT─▶│  Supabase API  │──RLS─▶│   Postgres   │
│   (Clerk)    │       │   (PostgREST)  │       │   (tabelas)  │
└──────────────┘       └────────────────┘       └──────────────┘
       ▲                                                ▲
       │                                                │
       │ webhook user.created / .updated / .deleted     │
       └──────────▶ POST /api/clerk/webhook ────────────┘
                   (back-end Node, service_role)
```

1. Usuário faz login no Clerk no front. Clerk devolve um JWT.
2. Front chama `createClient` do Supabase passando esse JWT no `Authorization`.
3. Toda query que chega no Postgres traz `request.jwt.claims.sub = "user_2abc..."`.
4. A função `clerk_user_id()` no SQL extrai esse `sub` e as policies cruzam com `users.clerk_user_id`.
5. Em paralelo, sempre que o Clerk cria/edita/deleta um usuário, ele dispara um webhook pra nossa API. Nossa API valida a assinatura e dá `upsert`/`delete` na tabela `users` usando a `service_role` (que bypassa RLS).

### Configuração no Clerk Dashboard
- **JWT Templates** → criar template "supabase" (o próprio Clerk já tem o preset).
- **Webhooks** → criar endpoint apontando pra `https://<sua-api>/api/clerk/webhook` escutando `user.created`, `user.updated`, `user.deleted`.

### Configuração no Supabase Dashboard
- **Authentication → Third-Party Auth → Add Clerk** → cola a issuer URL do Clerk.

---

## 3. As 13 tabelas — visão por blocos

### Bloco A — Identidade (users, addresses)

#### `users`
A "fonte da verdade" do perfil dentro da nossa app. Cada linha = uma pessoa, identificada pelo `clerk_user_id` (FK lógica pro Clerk). Email duplicado é citext (case-insensitive). Flag `is_professional` diz se a pessoa também atua como profissional (dual-mode, Seção 2.3 da visão).

Nunca tem senha — quem cuida disso é o Clerk.

#### `addresses`
Múltiplos endereços por cliente (Casa, Trabalho, outros — Seção 3.3). Cada endereço guarda `location` como `geography(point, 4326)` (WGS84, padrão GPS). Índice GIST permite buscas geográficas rápidas. Garantia: só um endereço pode ser `is_default = true` por usuário (índice único parcial).

### Bloco B — Lado profissional (professional_profiles, badges, professional_badges, services)

#### `professional_profiles`
Tabela 1-1 com `users` que **só existe quando a pessoa atua como profissional**. Separar isso evita inflar `users` com campos que 90% dos registros não usariam. Aqui mora:

- A vitrine: `bio`, `cover_url`, cidade base.
- O estado operacional: `is_online`, `service_radius_km`, `current_location`, `last_location_update`.
- Métricas denormalizadas: `total_jobs`, `average_rating`, `total_ratings` — recalculadas por trigger ao receber/editar review.
- `commission_rate`: comissão atual (de 0.20 a 0.30). Cai conforme conquista selos. Snapshotada no booking.

Índice especial: `prof_profiles_online_location_idx` é parcial — só indexa profissionais online. Acelera o matching "Agora".

#### `badges` (catálogo) + `professional_badges` (m2m)
Os 5 selos POPYNS (Seção 5):

| slug | nome |
|---|---|
| `verificada` | Verificada |
| `antecedentes` | Antecedentes |
| `treinamento` | Treinamento |
| `pontual` | Pontual |
| `top_avaliada` | Top Avaliada |

Seedados na criação do schema. Conquistar selo = inserir linha em `professional_badges`. Quem concede é a operação POPYNS (admin → futura interface), por isso o INSERT só pelo service_role.

#### `services`
Cada serviço que a profissional oferece, com **preço próprio** (sem padronização — Seção 4.4) em centavos (`bigint`) e `duration_minutes`. Liga em `service_categories` (catálogo).

### Bloco C — Pedido (bookings, booking_services, booking_status_events)

#### `bookings` — o coração
Toda interação cliente↔profissional vira um booking. Decisões importantes:

- **`address_snapshot` (jsonb)**: cópia do endereço no momento do pedido. Mesmo se a cliente editar/apagar o endereço depois, o histórico do booking fica íntegro.
- **`location` (geography)**: snapshot da coordenada também — pro mapa em tempo real e cálculo de ETA não dependerem da tabela `addresses`.
- **`mode` (enum)**: `'now'` (estilo Uber, sem `scheduled_at`) ou `'scheduled'` (com `scheduled_at` obrigatório). Constraint garante isso.
- **`commission_rate` / `commission_cents` / `net_to_professional_cents`**: snapshotados no momento do booking. Se a comissão da profissional cair (conquistou selo) depois, o booking antigo não muda. Audit trail correto.
- **Timestamps de transição**: `accepted_at`, `on_the_way_at`, `arrived_at`, `started_at`, `completed_at`, `cancelled_at`. Permitem calcular SLAs (tempo até aceite, tempo até chegar etc — Seção 10) sem precisar olhar a tabela de eventos.
- **`professional_id` nullable**: pra `mode = 'now'`, o booking pode ser criado **antes** de achar uma profissional. A API faz o matching e atualiza.

#### `booking_services`
Itens do pedido (1 booking pode ter N serviços — "manicure + pedicure + alongamento"). Igual ao bookings, faz snapshot de `name`, `price`, `duration` pra não quebrar se a profissional editar o serviço depois. O `is_done` + `done_at` alimenta o **checklist em atendimento** da Seção 4.2.

#### `booking_status_events`
Auditoria das transições. Toda mudança de status grava aqui. Útil pra:
- Reconstruir o histórico completo do pedido.
- Debugar disputas ("ela diz que cancelou às 14h e não às 15h").
- Métricas operacionais.

### Bloco D — Pós-serviço (reviews, favorites)

#### `reviews`
1-1 com `bookings` (constraint `unique` em `booking_id`). Estrelas de 1 a 5, `tags` como array de texto (`{"pontual","caprichada","higienica"}` — Seção 3.6).

Trigger `tg_reviews_recalc` recalcula `average_rating` e `total_ratings` da profissional **automaticamente** ao inserir/editar/deletar. Front nunca precisa fazer isso.

#### `favorites`
Cliente favorita profissional. Unique `(client_id, professional_id)` evita duplicata.

### Bloco E — Notificações

#### `notifications`
Feed in-app. `kind` enum (`booking_accepted`, `booking_on_the_way`, etc), `data` jsonb pra payload (booking_id, profissional_id, deep link). `read_at` null = não lida. Índice parcial em não-lidas pra contagem rápida do badge.

Push real (FCM/APNs) é responsabilidade da API Node — esta tabela é só o feed in-app.

### O que ficou **fora do MVP** (e por quê)

| Não está | Por que |
|---|---|
| Cupons | Seção 8 da visão lista como "no radar". Sem demanda agora, evita schema overengineered. |
| Pagamentos online | Modelo é **offline** (Pix/cartão/dinheiro entre cliente↔profissional). POPYNS só confirma o agendamento. Adicionar tabela `payments` agora seria ficção. |
| Repasses / earnings semanais | A "comissão" é dívida da profissional pra POPYNS (não o contrário, já que o dinheiro flui direto). O `commission_cents` no booking já carrega o dado bruto. Quando virar cobrança real, adiciona uma view ou tabela `commission_invoices`. |
| Chat em tempo real | Visão de produto diz "começamos com SMS/ligação". |
| Painel admin | Operação manual via SQL Editor / cliente Postgres por enquanto. |

---

## 4. RLS — Row Level Security

Tudo com RLS **ativado**. Sem exceção. Antes de explicar as policies, a regra de ouro:

> **Se a sua key é `anon` ou um JWT de usuário, você passa pelo RLS.**
> **Se você usar `service_role`, você bypassa.** Use só no back-end, nunca no front.

### A função `clerk_user_id()`

Toda policy chama essa função. Ela extrai o `sub` do JWT (= o ID Clerk do usuário logado). Se não houver JWT, retorna NULL e nada vaza.

### Padrões de policy usados

| Padrão | Quando aparece | Exemplo |
|---|---|---|
| **owner-only** | dado privado do próprio usuário | `addresses`, `favorites`, `notifications` |
| **public-read, owner-write** | vitrine pública editável só pelo dono | `services`, `professional_profiles` |
| **participant-only** | quem participa do registro pode ler/escrever | `bookings`, `booking_services` |
| **catalog (read-all)** | catálogos imutáveis | `badges`, `service_categories` |

### O que o webhook do Clerk faz (com service_role)
- INSERT inicial em `users` (porque o usuário acabou de existir — ainda não há linha pra RLS validar).
- UPDATE de `email` / `full_name` quando muda no Clerk.
- DELETE quando o usuário é deletado no Clerk (cascateia pra addresses, bookings via FK).

---

## 5. Conversão de unidades & convenções

| Campo | Tipo | Por quê |
|---|---|---|
| valores monetários | `bigint` em **centavos** | evita erros de ponto flutuante. R$ 50,00 → `5000`. |
| coordenadas | `geography(point, 4326)` | WGS84 (padrão GPS); GIST + ST_DWithin pra "perto de mim". |
| tempo | `timestamptz` | sempre UTC no banco, conversão de fuso no app. |
| PKs | `uuid` com `gen_random_uuid()` | não vaza contagem de registros; seguro em URL. |
| campos voláteis (preço, nome do serviço) usados em históricos | **snapshot** (cópia) na tabela filha | preserva integridade histórica mesmo quando o original muda. |
| enums de domínio (status, mode, payment_method) | `CREATE TYPE` PG | validação no banco + IntelliSense no Supabase client. |

---

## 6. Queries-modelo (vão pra API e front)

### Profissionais online no raio de 5km a partir de um ponto
```sql
select pp.*, u.full_name, u.avatar_url
from public.professional_profiles pp
join public.users u on u.id = pp.user_id
where pp.is_online = true
  and st_dwithin(
        pp.current_location,
        st_setsrid(st_makepoint(:lng, :lat), 4326)::geography,
        5000                                    -- metros
      );
```

### Selos de uma profissional (com nome)
```sql
select b.slug, b.name, pb.granted_at
from public.professional_badges pb
join public.badges b on b.id = pb.badge_id
where pb.professional_id = :professional_id
order by b.sort_order;
```

### Próximo atendimento da profissional
```sql
select *
from public.bookings
where professional_id = :professional_id
  and status in ('accepted','on_the_way','in_progress')
order by coalesce(scheduled_at, created_at) asc
limit 1;
```

### Comissão devida pela profissional na semana corrente
```sql
select sum(commission_cents)::bigint as commission_owed_cents
from public.bookings
where professional_id = :professional_id
  and status = 'completed'
  and completed_at >= date_trunc('week', now());
```

---

## 7. Como aplicar o schema (passo a passo)

1. Supabase Dashboard → **SQL Editor** → **New query**.
2. Abre `back-end/db/schema.sql`, copia tudo, cola.
3. Clica em **Run**. Demora ~5s.
4. Confere em **Table Editor** que as 13 tabelas apareceram.
5. Em **Database → Extensions**, confirma que `postgis`, `pgcrypto`, `citext` estão ON.
6. Em **Authentication → Third-Party Auth**, adiciona o **Clerk** (cola o Frontend API URL do Clerk).
7. No Clerk Dashboard, **JWT Templates → Supabase** (já vem pronto), e cria webhook pra `/api/clerk/webhook` na nossa API.
8. Cria as env vars no projeto Next.js e na nossa API:

```bash
# .env.local (Next.js front) — NUNCA commita
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# .env (back-end Node) — NUNCA commita
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx        # ⚠ rotacione a antiga, foi exposta
CLERK_SECRET_KEY=sk_xxx
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxx
```

---

## 8. Segurança — leia uma vez e nunca esqueça

- 🔴 **`sb_secret_...` (service_role) só na API Node.** Nunca vai pro front. Nunca vai pro Git. Nunca compartilha em chat.
- 🟢 `sb_publishable_...` (anon) pode ir pro front — RLS bloqueia o resto.
- A chave secreta que foi colada no chat **precisa ser rotacionada**: Supabase Dashboard → Settings → API → Reset secret key.
- Sempre que adicionar tabela nova: **enable RLS imediatamente** + escrever policy antes de usar no front.
- Webhook do Clerk: **sempre verifica a assinatura** (`svix` library) antes de aceitar o payload. Sem isso, qualquer um pode forjar `user.created` e injetar lixo no banco.

---

## 9. Próximos passos sugeridos

1. Rotacionar a `sb_secret_...` exposta (não é negociável).
2. Aplicar o `schema.sql` no SQL Editor.
3. Ativar a integração Clerk no Supabase (Third-Party Auth).
4. Subir a pasta `back-end/` com Express ou Fastify + endpoint `/api/clerk/webhook`.
5. No front Next.js, instanciar o cliente Supabase com o JWT do Clerk (`auth.getToken({ template: 'supabase' })`).
6. Construir o primeiro fluxo de ponta a ponta: cadastro Clerk → webhook insere em `users` → cliente edita o próprio perfil via RLS.
