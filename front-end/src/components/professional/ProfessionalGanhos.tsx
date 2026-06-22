"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const BRL = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 0 });

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const todayIdx = new Date().getDay();
const todayDayOfMonth = new Date().getDate() - 1; // 0-indexed para barra do mês
const todayMonthIdx = new Date().getMonth();       // 0-indexed para barra do ano

type Period = "semana" | "mes" | "ano";

const MOCK_GANHOS = {
  semana: { bruto: 1840, taxa: 276, liquido: 1564, bars: [40, 65, 50, 80, 95, 70, 45], atendimentos: [2, 4, 3, 5, 6, 4, 3], nextPayout: "Terça, 16 jun" },
  mes:    { bruto: 6420, taxa: 963, liquido: 5457, bars: [60, 75, 40, 90, 55, 80, 65, 70, 45, 85, 50, 95, 30, 75, 60, 80, 55, 70, 40, 65, 90, 45, 75, 60, 85, 50, 70, 45, 80, 65], atendimentos: [4,5,3,6,4,5,4,5,3,6,3,7,2,5,4,5,4,5,3,4,6,3,5,4,6,3,5,3,5,4], nextPayout: "Terça, 16 jun" },
  ano:    { bruto: 38500, taxa: 5775, liquido: 32725, bars: [55, 70, 45, 80, 60, 75, 90, 50, 65, 85, 40, 70], atendimentos: [18, 22, 15, 26, 19, 24, 28, 16, 21, 27, 13, 23], nextPayout: "Terça, 16 jun" },
};

const MOCK_TRANSACOES = [
  { id: "1", date: "2026-06-12", dateLabel: "Hoje, 12 jun",    clientName: "Camila Machado", service: "Manicure em gel",    bruto: 85,  liquido: 72,  status: "paid" },
  { id: "2", date: "2026-06-12", dateLabel: "Hoje, 12 jun",    clientName: "Ana Lima",       service: "Pedicure completa", bruto: 55,  liquido: 47,  status: "paid" },
  { id: "3", date: "2026-06-10", dateLabel: "10 jun",          clientName: "Beatriz Costa",  service: "Manicure simples",  bruto: 45,  liquido: 38,  status: "paid" },
  { id: "4", date: "2026-06-08", dateLabel: "8 jun",           clientName: "Júlia Ferreira", service: "Manicure em gel",   bruto: 85,  liquido: 72,  status: "paid" },
  { id: "5", date: "2026-06-05", dateLabel: "5 jun",           clientName: "Larissa Rocha",  service: "Pé e mão completo", bruto: 120, liquido: 102, status: "paid" },
  { id: "6", date: "2026-06-03", dateLabel: "3 jun",           clientName: "Fernanda Alves", service: "Pedicure completa", bruto: 55,  liquido: 47,  status: "pending" },
];

// Group transactions by date
function groupByDate(items: typeof MOCK_TRANSACOES) {
  const map = new Map<string, { label: string; items: typeof MOCK_TRANSACOES }>();
  for (const t of items) {
    if (!map.has(t.date)) map.set(t.date, { label: t.dateLabel, items: [] });
    map.get(t.date)!.items.push(t);
  }
  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
}

const PERIOD_LABELS: Record<Period, string> = { semana: "Semana", mes: "Mês", ano: "Ano" };

const WEEK_DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function nextLaunchDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const dia = WEEK_DAYS_PT[d.getDay()];
  const num = d.getDate();
  const mes = MONTHS_PT[d.getMonth()];
  return `${dia}, ${num} ${mes}`;
}

export function ProfessionalGanhos() {
  const [period, setPeriod] = useState<Period>("semana");
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const data = MOCK_GANHOS[period];
  const groups = groupByDate(MOCK_TRANSACOES);

  const barDays = period === "semana"
    ? WEEK_DAYS
    : period === "mes"
    ? data.bars.map((_, i) => String(i + 1))
    : ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    setSelectedBar(null);
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ overflowY: "auto", scrollbarWidth: "none" }}>

      {/* Header */}
      <header className="shrink-0" style={{ background: "var(--wine-800)" }}>
        <div className="px-5 pt-8 pb-2 text-center">
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500, fontSize: "32px", lineHeight: 1.1, color: "var(--cream-100)" }}>
            Ganhos
          </h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-manrope)", color: "rgba(245,239,230,0.5)" }}>
            Área Financeira
          </p>
        </div>

        {/* Period tabs */}
        <div className="flex border-b mt-3" style={{ borderColor: "rgba(245,239,230,0.1)" }}>
          {(["semana", "mes", "ano"] as Period[]).map((p) => {
            const active = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p)}
                className="flex-1 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider relative"
                style={{ fontFamily: "var(--font-manrope)", color: active ? "var(--cream-100)" : "rgba(245,239,230,0.4)" }}
              >
                {PERIOD_LABELS[p]}
                {active && (
                  <motion.div
                    layoutId="ganhosPeriodTab"
                    className="absolute bottom-0 left-0 right-0 h-[1.5px]"
                    style={{ background: "var(--rose-200)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <div className="bg-warm-gradient flex-1 px-5 pt-5 pb-10 flex flex-col gap-4">

        {/* Resumo */}
        <div className="rounded-[22px] bg-white/85 p-5 border" style={{ borderColor: "rgba(92,3,49,0.08)" }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}>A Receber</p>
              <p style={{ fontFamily: "var(--font-manrope)", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.05, color: "var(--success-700)", fontVariantNumeric: "tabular-nums" }}>
                R$ {BRL(data.liquido)}
              </p>
            </div>
            {period === "semana" && (
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}>Próximo Lançamento</p>
                <p style={{ fontFamily: "var(--font-manrope)", fontSize: 14, fontWeight: 600, color: "var(--success-700)" }}>
                  {nextLaunchDate()}
                </p>
              </div>
            )}
          </div>

          <div className="my-4 h-px" style={{ background: "rgba(92,3,49,0.08)" }} />

          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}>Repasse</p>
            <p style={{ fontFamily: "var(--font-manrope)", fontSize: 18, fontWeight: 700, color: "var(--wine-800)", fontVariantNumeric: "tabular-nums" }}>
              R$ {BRL(data.bruto)}
            </p>
          </div>
        </div>

        {/* Gráfico */}
        <div className="rounded-[22px] bg-white/85 p-4 border" style={{ borderColor: "rgba(92,3,49,0.08)" }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}>
            {period === "semana" ? "Esta Semana" : period === "mes" ? "Este Mês" : "Este Ano"}
          </p>
          <div className="relative flex gap-1" style={{ height: 80 }}>
            {data.bars.map((h, i) => {
              const isToday =
                (period === "semana" && i === todayIdx) ||
                (period === "mes"    && i === todayDayOfMonth) ||
                (period === "ano"    && i === todayMonthIdx);
              const isSelected = selectedBar === i;
              const barHeightPx = (h / 100) * 80;
              return (
                <div
                  key={i}
                  className="flex-1 relative cursor-pointer"
                  style={{ minWidth: 4 }}
                  onClick={() => setSelectedBar(isSelected ? null : i)}
                >
                  {isSelected && (
                    <span
                      className="absolute left-1/2 rounded-full px-1.5 py-0.5 whitespace-nowrap"
                      style={{
                        transform: "translateX(-50%)",
                        bottom: barHeightPx + 5,
                        background: "var(--wine-800)",
                        color: "var(--cream-100)",
                        fontSize: 9,
                        fontFamily: "var(--font-manrope)",
                        fontWeight: 700,
                        lineHeight: 1.4,
                        zIndex: 10,
                      }}
                    >
                      {data.atendimentos[i]}
                    </span>
                  )}
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-[4px]"
                    style={{
                      height: `${h}%`,
                      background: isSelected
                        ? "#9b2254"
                        : isToday
                        ? "var(--wine-800)"
                        : "rgba(92,3,49,0.18)",
                      transition: "background 0.15s",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-1">
            {barDays.map((d, i) => (
              <span
                key={i}
                className="flex-1 text-center"
                style={{
                  fontSize: period === "mes" ? 7 : 10,
                  color:
                    (period === "semana" && i === todayIdx) ||
                    (period === "mes"    && i === todayDayOfMonth) ||
                    (period === "ano"    && i === todayMonthIdx)
                      ? "var(--wine-800)"
                      : "var(--ink-500)",
                  fontFamily: "var(--font-manrope)",
                  fontWeight:
                    (period === "semana" && i === todayIdx) ||
                    (period === "mes"    && i === todayDayOfMonth) ||
                    (period === "ano"    && i === todayMonthIdx)
                      ? 700 : 400,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Composição / breakdown */}
        <div className="rounded-[22px] bg-white/85 p-5 border flex flex-col gap-3" style={{ borderColor: "rgba(92,3,49,0.08)" }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}>Composição</p>

          <div className="flex justify-between items-center">
            <span className="text-[12px]" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}>Valor Bruto</span>
            <span className="text-[13px] font-semibold" style={{ color: "var(--wine-900)", fontFamily: "var(--font-manrope)" }}>R$ {BRL(data.bruto)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px]" style={{ color: "rgba(180,50,50,0.75)", fontFamily: "var(--font-manrope)" }}>Taxas</span>
            <span className="text-[13px] font-semibold" style={{ color: "rgba(180,50,50,0.75)", fontFamily: "var(--font-manrope)" }}>− R$ {BRL(data.taxa)}</span>
          </div>
          <div className="h-px" style={{ background: "rgba(92,3,49,0.08)" }} />
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-bold" style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}>Valor Líquido</span>
            <span className="text-[14px] font-bold" style={{ color: "var(--success-700)", fontFamily: "var(--font-manrope)" }}>R$ {BRL(data.liquido)}</span>
          </div>
        </div>

        {/* Extrato */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}>Transações</p>

          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.date}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}>
                  {group.label}
                </p>
                <div className="flex flex-col gap-2">
                  {group.items.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 rounded-[16px] bg-white/70 px-4 py-3 border"
                      style={{ borderColor: "rgba(92,3,49,0.08)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: "var(--wine-900)", fontFamily: "var(--font-manrope)" }}>
                          {t.clientName}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}>
                          {t.service}
                        </p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[13px] font-bold" style={{ color: "var(--success-700)", fontFamily: "var(--font-manrope)" }}>
                          R$ {BRL(t.liquido)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
