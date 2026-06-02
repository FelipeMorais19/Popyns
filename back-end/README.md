# POPYNS — Back-end

API Node.js (Express 5, ESM) que cobre:

- **Webhook do Clerk** → sincroniza criação/edição/exclusão de usuário com a tabela `users` do Supabase.
- **Endpoints sensíveis** (que precisam de `service_role` ou lógica de negócio que não dá pra resolver com RLS direto). Por enquanto, só `GET /api/me` como exemplo.
- **Health check** pra monitoramento.

> O grosso das queries (listar profissionais, criar booking, favoritar etc) **não passa por aqui**: o front Next.js fala direto com o Supabase via JWT do Clerk + RLS. Veja `back-end/db/DATABASE.md`.

---

## Estrutura

```
back-end/
├── db/
│   ├── schema.sql         # rodar no SQL Editor do Supabase
│   └── DATABASE.md        # documentação do schema
├── src/
│   ├── config/
│   │   └── env.js         # validação das env vars
│   ├── lib/
│   │   ├── supabase.js    # cliente service-role (server-only)
│   │   └── logger.js      # pino
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── health.js          # GET /health
│   │   ├── clerkWebhook.js    # POST /api/clerk/webhook
│   │   └── me.js              # GET /api/me  (requer JWT Clerk)
│   └── server.js          # entry
├── .env.example
├── .gitignore
└── package.json
```

---

## 1. Instalar

```bash
cd back-end
npm install
```

Requer **Node 20.6+** (usamos os flags nativos `--watch` e `--env-file`).

---

## 2. Configurar `.env`

```bash
cp .env.example .env
```

Preencha:

| Variável | Onde pegar |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → **service_role / secret key** (NUNCA front) |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API keys → Secret keys |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk Dashboard → Webhooks → endpoint criado → Signing Secret (após criar) |

---

## 3. Rodar

```bash
npm run dev    # node --watch --env-file=.env src/server.js
```

Logs bonitinhos via `pino-pretty`. Em produção, sem `--env-file` (env injetadas pelo runtime) e logs em JSON puro.

Teste:
```bash
curl http://localhost:3001/health
# { "status": "ok", "uptime_seconds": 3, "now": "..." }
```

---

## 4. Configurar webhook no Clerk (passo a passo)

O Clerk não chega no `localhost` direto. Em dev, exponha sua máquina via túnel.

### 4.1 Túnel HTTPS pro localhost (escolha um)

**ngrok** (mais comum):
```bash
ngrok http 3001
# pega a URL https://abc123.ngrok-free.app
```

**Cloudflare Tunnel**:
```bash
cloudflared tunnel --url http://localhost:3001
```

### 4.2 Criar o endpoint no Clerk

1. Clerk Dashboard → **Webhooks** → **Add Endpoint**.
2. **Endpoint URL**:
   - Dev: `https://abc123.ngrok-free.app/api/clerk/webhook`
   - Prod: `https://api.popyns.com.br/api/clerk/webhook`
3. **Message Filtering** → marca:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. **Create**.
5. Copia o **Signing Secret** (`whsec_...`) que aparece e cola em `.env` → `CLERK_WEBHOOK_SIGNING_SECRET`.
6. Reinicia o `npm run dev` pra carregar a nova variável.

### 4.3 Testar

No próprio painel do webhook no Clerk, clique em **Testing** → **Send Example** com tipo `user.created`. O log do `npm run dev` deve mostrar:

```
[14:32:01.123] INFO: Synced user
    clerkUserId: "user_2abc..."
    email: "test@clerk.dev"
```

Confirma também no Supabase:
```sql
select * from public.users order by created_at desc limit 5;
```

---

## 5. Configurar a integração Clerk ↔ Supabase (Third-Party Auth)

Pra o **front-end** falar direto com o Supabase usando o JWT do Clerk:

1. **No Clerk Dashboard** → **JWT Templates** → **New template** → escolha o preset **Supabase** (ou crie um chamado `supabase`).
2. **No Supabase Dashboard** → **Authentication** → **Sign In / Up** → **Third-Party Auth** → **Add provider** → **Clerk**.
   - Cola a **Frontend API URL** que aparece no Clerk Dashboard (ex: `https://clerk.<seu-domínio>.com` ou `https://relaxed-zebra-12.clerk.accounts.dev`).
3. No front Next.js, ao instanciar o `createClient`, passe a função que pega o token Clerk:
   ```js
   import { createClient } from '@supabase/supabase-js';
   import { useAuth } from '@clerk/nextjs';

   const { getToken } = useAuth();
   const supabase = createClient(URL, PUB_KEY, {
     global: {
       fetch: async (input, init) => {
         const token = await getToken({ template: 'supabase' });
         const headers = new Headers(init?.headers);
         if (token) headers.set('Authorization', `Bearer ${token}`);
         return fetch(input, { ...init, headers });
       },
     },
   });
   ```
   (Detalhe que cuidamos depois quando montar o front.)

---

## 6. Endpoints

| Método | Rota | Auth | Função |
|---|---|---|---|
| GET | `/health` | público | Health check |
| POST | `/api/clerk/webhook` | assinatura svix | Sincroniza usuário do Clerk → tabela `users` |
| GET | `/api/me` | JWT Clerk | Devolve perfil do logado + dados de profissional (se aplicável) |

### Exemplo: chamar `/api/me`

No front (Next.js + Clerk):
```js
import { useAuth } from '@clerk/nextjs';

const { getToken } = useAuth();
const token = await getToken();   // JWT padrão do Clerk
const r = await fetch('http://localhost:3001/api/me', {
  headers: { Authorization: `Bearer ${token}` },
});
const { user } = await r.json();
```

---

## 7. Decisões e convenções

- **Sem TypeScript** por enquanto (estamos em JS). Migração possível depois sem grandes mudanças.
- **ESM puro** (`"type": "module"`). Imports com extensão `.js`.
- **`service_role` key só aqui** — nunca no front. O cliente em `src/lib/supabase.js` (`supabaseAdmin`) bypassa RLS; trate como root no banco.
- **Ordem dos middlewares importa**: webhook do Clerk vem **antes** do `express.json()`, senão o body cru é consumido e a verificação svix falha.
- **Erros**: rotas usam `try/catch` + `next(err)`. O `errorHandler` global formata. Em dev sai stack; em prod, só `error`.
- **Logs**: `pino` estruturado. `pino-http` adiciona um log por request. Em dev, `pino-pretty` colore.
- **Graceful shutdown**: SIGINT/SIGTERM fecham o servidor antes de sair.

---

## 8. O que vem a seguir

Conforme o produto evolui, esta API recebe:

- **Matching** geográfico pra modo "Agora" (acha profissional online mais próxima dentro do raio, oferece em sequência).
- **Transições de status** do booking com validação de regras (quem pode aceitar/recusar, prazos, comissão snapshot).
- **Jobs cron**: expiração de pedidos "Agora" sem resposta, recálculo semanal de comissão, distribuição automática de selo "Pontual" (95%+ no horário em 60 dias).
- **Endpoint de upload** de portfólio / foto (Supabase Storage com URLs assinadas).
- **Push notifications** (FCM/APNs) disparadas a partir das transições de booking.

Quando precisar, eu monto cada um desses no padrão estabelecido.
