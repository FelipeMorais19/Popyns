-- =============================================================================
-- POPYNS — Storage RLS Policies
-- Bucket: popyns (privado)
--
-- Convenção de path:
--   <clerk_user_id>/avatar/profile.<ext>
--   <clerk_user_id>/portfolio/<photo_id>.<ext>
--   <clerk_user_id>/cover/cover.<ext>
--
-- O PRIMEIRO segmento do path é SEMPRE o clerk_user_id do dono.
-- Isso simplifica a política: basta comparar (storage.foldername(name))[1].
--
-- Como aplicar:
--   1. Crie o bucket "popyns" no Dashboard (Storage → Create bucket → name=popyns,
--      Public: OFF, file size limit: 5MB recomendado pra avatar).
--   2. Cole este arquivo no SQL Editor e rode.
-- =============================================================================

-- Garante que o bucket existe (idempotente). Se você já criou via Dashboard, isso vira no-op.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('popyns', 'popyns', false, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

-- RLS já vem ON em storage.objects no Supabase. Só precisamos criar as policies.

-- ─── LEITURA: qualquer logado pode ler tudo do bucket popyns ─────────────────
drop policy if exists "popyns_select_authenticated" on storage.objects;
create policy "popyns_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'popyns');

-- ─── ESCRITA: só o dono escreve no próprio path ──────────────────────────────
-- Path convention: <clerk_user_id>/...
-- auth.jwt() ->> 'sub' é o ID Clerk do usuário (via Third-Party Auth)

drop policy if exists "popyns_insert_own" on storage.objects;
create policy "popyns_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'popyns'
    and (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
  );

drop policy if exists "popyns_update_own" on storage.objects;
create policy "popyns_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'popyns'
    and (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
  )
  with check (
    bucket_id = 'popyns'
    and (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
  );

drop policy if exists "popyns_delete_own" on storage.objects;
create policy "popyns_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'popyns'
    and (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
  );

-- =============================================================================
-- Notas operacionais
-- =============================================================================
-- • Quem é "authenticated" aqui? Qualquer request que chega com um JWT válido
--   reconhecido pelo Supabase. Com a integração Clerk Third-Party Auth, o JWT
--   de sessão do Clerk vale como authenticated.
-- • Anônimos não acessam nada (não tem policy pra role 'anon').
-- • O bucket continua "private" no Dashboard. Sem JWT, nem o objeto é listado.
-- • A pasta raiz é o clerk_user_id (não o uuid de public.users) — assim a
--   policy não precisa fazer join com a tabela users.
-- =============================================================================
