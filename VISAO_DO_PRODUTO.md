# POPYNS — Visão de Produto (detalhada)

> O que o aplicativo **oferece**, em detalhe — funcionalidade por funcionalidade, para os dois lados do marketplace. Este é o documento mais completo sobre o "o quê" do produto. Para o "como construir" veja o plano de desenvolvimento; para o "como navega" veja `FLOWS.md`.

---

## 1. A promessa central

> **Beleza onde você está.**

POPYNS conecta **mulheres que querem cuidar de si** a **profissionais de beleza verificadas** que vão até a casa delas. Com a praticidade de um app de mobilidade (chamar agora ou agendar) e a segurança de uma curadoria séria (selos de confiança).

**O problema que resolvemos:**
- Para a **cliente**: salão lotado, deslocamento, tempo perdido, insegurança em chamar alguém desconhecido em casa.
- Para a **profissional**: agenda ociosa, dependência de clientes fixas, dificuldade de conseguir novas clientes com segurança e de receber.

**Como resolvemos:** um marketplace móvel, geolocalizado, com verificação por selos, pagamento facilitado e atendimento no conforto de casa.

---

## 2. Os dois lados — visão geral

### 👩 Lado Cliente
A mulher abre o app, vê profissionais perto dela no mapa, escolhe (ou pede a mais próxima agora), acompanha a chegada em tempo real, é atendida em casa, paga e avalia.

### 💼 Lado Profissional
A profissional ativa o "online", recebe pedidos por perto, aceita em segundos, vai até a cliente, executa o serviço, e acompanha ganhos e repasses. Sobe de ranking conquistando selos.

### 🔄 Um app, dois modos
Mesmo login. Quem é profissional pode **virar cliente** com um toque (também quer se cuidar no dia de folga). Sem segunda conta, sem segundo app.

---

## 3. O que o app oferece — CLIENTE

### 3.1 Descoberta e busca
- **Mapa na home** (estilo Uber) com profissionais disponíveis por perto, cada uma com foto no pino.
- **Categorias** em destaque: Manicure/Pedicure, Cabelo, Maquiagem, Depilação, Sobrancelha/Cílios, Massagem/Estética, Limpeza doméstica (e extensível).
- **Busca por texto** (serviço ou nome da profissional).
- **Filtros**: disponibilidade ("Agora"), distância (raio em km), nota mínima (★), especialidade, faixa de preço.
- **Lista ordenada** por relevância (selos + nota + proximidade).

### 3.2 Perfil da profissional (vitrine)
- Foto de capa + galeria de **portfólio** (trabalhos reais).
- **Selos POPYNS** exibidos com destaque (verificação de confiança).
- **Avaliação média** + número de avaliações + comentários de clientes.
- **Serviços e preços** (cada um com duração estimada).
- Stats: tempo na plataforma, total de atendimentos, distância até você.
- Botão **favoritar** (coração).

### 3.3 Pedido (o coração do app)
Dois modos, a cliente escolhe:
- **Agora** (estilo Uber): o sistema oferece o pedido à profissional disponível mais próxima. Tempo estimado de chegada exibido.
- **Agendar**: escolhe profissional + dia + horário.

No pedido a cliente:
- Seleciona **um ou mais serviços** (some o total e o tempo).
- Confirma o **endereço** (Casa, Trabalho ou outro).
- Adiciona **observação** (ex: "prefiro tons nudes", "tenho alergia a X").
- Vê o **total estimado** e escolhe o meio de pagamento.

### 3.4 Acompanhamento ao vivo
- **Mapa em tempo real** com a profissional a caminho + ETA atualizado.
- **Stepper** de status: Aceito → A caminho → Em atendimento → Concluído.
- Botões de **ligar** e **mensagem** para a profissional.
- Notificações push em cada etapa ("Beatriz aceitou!", "está a caminho", "chegou").
- Opção de **cancelar** (regras de cancelamento conforme etapa).

### 3.5 Pagamento
- Métodos: **Pix** (QR na hora), **Cartão** (maquininha da profissional), **Dinheiro**.
- **Importante (modelo legal):** a POPYNS **apenas confirma o agendamento online**. O pagamento do atendimento acontece **direto entre cliente e profissional** — a plataforma não opera esse dinheiro (alinhado ao PL Uber 2024).
- Suporte a **cupons** de desconto.

### 3.6 Pós-serviço e relacionamento
- **Avaliação**: nota em estrelas + tags rápidas (Pontual, Caprichada, Higiênica…) + comentário opcional.
- **Favoritos**: salva profissionais boas para rechamar fácil, organizadas por categoria.
- **Histórico** de atendimentos (com recibo).
- **Notificações**: status de pedidos, promoções, lembretes, profissional favorita com agenda aberta.
- **Perfil & Configurações**: dados, múltiplos endereços, meios de pagamento, segurança/privacidade, central de ajuda.

### 3.7 Confiança (transversal)
- Tela educativa explicando os **5 selos POPYNS**.
- Garantia: **nenhuma profissional aparece sem ao menos 1 selo** (Verificada).

---

## 4. O que o app oferece — PROFISSIONAL

### 4.1 Dashboard
- **Toggle Online/Offline** com raio de atendimento.
- **Ganhos do dia** + comparativo com ontem.
- **Atendimentos** do dia / semana.
- **Próximo atendimento** em destaque (cliente, serviço, horário, distância).
- **Progresso de selos** (quanto falta para o próximo).
- **Gráfico da semana** + valor a receber e previsão de repasse.

### 4.2 Receber e executar pedidos
- **Solicitação chegando** (estilo Uber): dados da cliente, serviço, valor líquido (já com a comissão descontada), endereço e distância. **Aceitar/Recusar em 30 segundos**.
- **Em atendimento**: timer, checklist dos serviços (marca conforme conclui), observação da cliente em destaque.
- Botões de **ligar/mensagem** com a cliente.

### 4.3 Ganhos e repasses
- **Ganhos da semana** (bruto, comissão POPYNS, líquido).
- **Breakdown por método** (Pix, cartão, dinheiro).
- **Repasse semanal** (terças; fechamento na madrugada de segunda).
- **Histórico** de atendimentos com valores e método.
- Meta semanal com barra de progresso.

### 4.4 Vitrine e crescimento
- **Perfil público** editável (bio, portfólio, serviços, preços).
- **Preços livres**: a profissional cobra o que quiser — a POPYNS **não padroniza**.
- **Selos** como motor de crescimento: mais selos = melhor ranking = mais pedidos = menor comissão.

---

## 5. O sistema de Selos POPYNS (diferencial #1)

Selos são camadas de verificação que **viram ranking**. São 5, acumulativos:

| # | Selo | Como se conquista |
|---|---|---|
| 1 | **Verificada** | Documento e CPF conferidos pela POPYNS |
| 2 | **Antecedentes** | Análise minuciosa de antecedentes criminais |
| 3 | **Treinamento** | Curso interno de higiene, postura e atendimento |
| 4 | **Pontual** | 95%+ dos atendimentos no horário (últimos 60 dias) |
| 5 | **Top Avaliada** | Média ≥ 4.8 com 50+ avaliações |

**Regras:**
- Mínimo de **1 selo (Verificada)** para aparecer no app.
- Mínimo de **2 selos** para ganhar destaque no ranking.
- Mais selos → **comissão menor** (incentivo a melhorar).

---

## 6. Regras de negócio essenciais

| Regra | Definição |
|---|---|
| **Comissão** | Variável de **20% a 30%** por atendimento. Profissionais com mais selos pagam menos. |
| **Preço** | Definido livremente pela profissional. Sem teto, sem padronização. |
| **Pagamento** | Plataforma só confirma o agendamento. Dinheiro do serviço flui direto cliente↔profissional. |
| **Repasse** | Semanal, às terças (referente à semana anterior). |
| **Visibilidade** | Sem selo mínimo, não aparece. |
| **Cancelamento** | Antes do aceite: grátis. Depois: política de tarifa parcial (a definir). |
| **Foco** | Mulheres (clientes e profissionais). Atendimento em casa, sem ponto físico. |

---

## 7. Categorias de serviço (MVP)

Manicure/Pedicure (tradicional e gel) · Cabelo (corte, escova, coloração) · Maquiagem · Depilação · Sobrancelha/Cílios · Massagem/Estética · Limpeza doméstica · (extensível).

---

## 8. O que NÃO está no MVP (mas está no radar)

- Pagamento processado dentro do app com split automático
- Chat completo em tempo real (começamos com SMS/ligação)
- Programa de fidelidade e cupons avançados
- Múltiplas cidades / multi-região
- Agenda recorrente ("toda quinta")
- Carteira digital da profissional
- Indicação com cashback automatizado
- App nativo puro (vamos de PWA + Capacitor)
- Painel administrativo web avançado

---

## 9. Personas (resumo)

- **Camila, 33 — cliente.** Home office, marca manicure no almoço, evita salão lotado, confia em indicação, paga Pix.
- **Beatriz, 28 — profissional.** Manicure em gel há 3 anos, quer agenda cheia, sai com a maletinha, 4-6 atendimentos/dia na Zona Sul de SP.

---

## 10. Métricas de sucesso (resumo)

Tempo até aceite `< 3 min` · Avaliação média `≥ 4.8★` · Recompra 30 dias `60%+` · Comissão média `20-30%` · Cancelamento pós-aceite `< 2%` · Pagamentos online `70%+` · Expansão `+1 região / 2 meses`.

---

## 11. Por que vai dar certo (tese)

1. **Confiança como diferencial** — selos verificáveis resolvem o maior medo (deixar alguém entrar em casa).
2. **Conveniência real** — "agora" ou "agendar", a cliente decide; tudo no celular.
3. **Liberdade para a profissional** — preço próprio, agenda própria, recebimento garantido.
4. **Mercado grande e fragmentado** — beleza em domicílio hoje vive de WhatsApp e indicação solta; falta uma plataforma séria.
5. **Modelo enxuto** — um app, dois modos; PWA que vira nativo; infra barata no início.

---

_Documento de visão de produto. Atualize quando o escopo mudar. Referências: `CLAUDE.md` (negócio), `FLOWS.md` (telas), `STYLE.md` (marca), plano de desenvolvimento (execução)._
