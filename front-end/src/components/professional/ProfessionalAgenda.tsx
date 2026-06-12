"use client";

import { useState } from "react";

const WEEK_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const DAY_NAMES = [
  "Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira",
  "Quinta-Feira", "Sexta-Feira", "Sábado",
];

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayYMD() {
  return toYMD(new Date());
}

// Mock appointments
const MOCK_APPOINTMENTS = [
  { id: "1", date: "2026-06-12", time: "09:00", clientName: "Camila Machado", service: "Manicure em gel", status: "confirmed", price: "R$ 85", duration: "1h30" },
  { id: "2", date: "2026-06-12", time: "11:30", clientName: "Ana Lima", service: "Pedicure completa", status: "confirmed", price: "R$ 55", duration: "1h" },
  { id: "3", date: "2026-06-15", time: "14:00", clientName: "Beatriz Costa", service: "Manicure simples", status: "pending", price: "R$ 45", duration: "45min" },
  { id: "4", date: "2026-06-18", time: "10:00", clientName: "Júlia Ferreira", service: "Manicure em gel", status: "confirmed", price: "R$ 85", duration: "1h30" },
  { id: "5", date: "2026-06-18", time: "14:30", clientName: "Larissa Rocha", service: "Pé e mão completo", status: "confirmed", price: "R$ 120", duration: "2h" },
  { id: "6", date: "2026-06-22", time: "09:30", clientName: "Fernanda Alves", service: "Pedicure completa", status: "pending", price: "R$ 55", duration: "1h" },
  { id: "7", date: "2026-06-25", time: "16:00", clientName: "Mariana Souza", service: "Manicure em gel", status: "confirmed", price: "R$ 85", duration: "1h30" },
];

function getDaysWithAppointments(): Set<string> {
  return new Set(MOCK_APPOINTMENTS.map((a) => a.date));
}

export function ProfessionalAgenda() {
  const today = todayYMD();
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const daysWithAppts = getDaysWithAppointments();

  // Build calendar grid
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean; ymd: string }[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    const d = prevMonthDays - firstWeekday + 1 + i;
    const pm = new Date(year, month - 1, d);
    cells.push({ day: d, current: false, ymd: toYMD(pm) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, ymd: toYMD(new Date(year, month, d)) });
  }
  const remaining = 7 - (cells.length % 7 === 0 ? 7 : cells.length % 7);
  for (let i = 1; i <= remaining && remaining < 7; i++) {
    cells.push({ day: i, current: false, ymd: toYMD(new Date(year, month + 1, i)) });
  }

  // Appointments for selected day
  const dayAppts = MOCK_APPOINTMENTS.filter((a) => a.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  const selectedDateObj = new Date(selectedDate + "T12:00:00");
  const dayLabel = `${DAY_NAMES[selectedDateObj.getDay()]}, ${selectedDateObj.getDate()} de ${MONTH_NAMES[selectedDateObj.getMonth()]}`;

  function prevMonth() {
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ overflowY: "auto", scrollbarWidth: "none" }}>

      {/* Calendário */}
      <div className="shrink-0 px-5 pt-6 pb-4" style={{ background: "var(--wine-800)" }}>

        {/* Mês navegação */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ background: "rgba(245,239,230,0.12)", color: "var(--cream-100)" }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <p
            className="text-[15px] font-bold"
            style={{ color: "var(--cream-100)", fontFamily: "var(--font-manrope)" }}
          >
            {MONTH_NAMES[month]} {year}
          </p>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ background: "rgba(245,239,230,0.12)", color: "var(--cream-100)" }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Labels dos dias da semana */}
        <div className="grid grid-cols-7 mb-1">
          {WEEK_LABELS.map((l, i) => (
            <p
              key={i}
              className="text-center text-[11px] font-bold uppercase py-1"
              style={{ color: "rgba(245,239,230,0.45)", fontFamily: "var(--font-manrope)" }}
            >
              {l}
            </p>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const isToday = cell.ymd === today;
            const isSelected = cell.ymd === selectedDate;
            const hasAppt = daysWithAppts.has(cell.ymd) && cell.current;

            return (
              <button
                key={i}
                type="button"
                onClick={() => cell.current && setSelectedDate(cell.ymd)}
                className="flex flex-col items-center py-1 gap-0.5"
                disabled={!cell.current}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold transition-all"
                  style={{
                    fontFamily: "var(--font-manrope)",
                    background: isSelected
                      ? "var(--cream-100)"
                      : isToday
                      ? "rgba(245,239,230,0.2)"
                      : "transparent",
                    color: isSelected
                      ? "var(--wine-800)"
                      : cell.current
                      ? "var(--cream-100)"
                      : "rgba(245,239,230,0.2)",
                    fontWeight: isSelected || isToday ? 700 : 500,
                  }}
                >
                  {cell.day}
                </span>
                {hasAppt && (
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: isSelected ? "var(--wine-800)" : "rgba(245,239,230,0.6)" }}
                  />
                )}
                {!hasAppt && <span className="h-1 w-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de atendimentos */}
      <div className="bg-warm-gradient flex-1 px-5 pt-5 pb-10">

        {/* Cabeçalho do dia */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[13px] font-bold" style={{ color: "var(--wine-900)", fontFamily: "var(--font-manrope)" }}>
              {dayLabel}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}>
              {dayAppts.length === 0
                ? "Nenhum atendimento"
                : `${dayAppts.length} atendimento${dayAppts.length > 1 ? "s" : ""}`}
            </p>
          </div>
          {selectedDate === today && (
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(92,3,49,0.1)", color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
            >
              Hoje
            </span>
          )}
        </div>

        {/* Cards de atendimento */}
        {dayAppts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-[22px] py-12 border border-dashed"
            style={{ borderColor: "rgba(92,3,49,0.15)" }}
          >
            <p className="text-[13px]" style={{ color: "rgba(92,3,49,0.35)", fontFamily: "var(--font-manrope)" }}>
              Sem atendimentos neste dia
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dayAppts.map((appt) => (
              <button
                key={appt.id}
                type="button"
                className="flex items-center gap-4 rounded-[18px] p-4 text-left w-full border bg-white/70 transition-all active:scale-[0.98]"
                style={{ borderColor: "rgba(92,3,49,0.08)" }}
              >
                {/* Linha colorida lateral */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
                  >
                    {appt.time}
                  </span>
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: appt.status === "confirmed" ? "#4E7A4A" : "#C9A020" }}
                  />
                </div>
                {/* Divisor */}
                <div
                  className="w-[2px] self-stretch rounded-full shrink-0"
                  style={{ background: appt.status === "confirmed" ? "rgba(78,122,74,0.35)" : "rgba(201,160,32,0.35)" }}
                />
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[14px] font-bold truncate"
                    style={{ color: "var(--wine-900)", fontFamily: "var(--font-manrope)" }}
                  >
                    {appt.clientName}
                  </p>
                  <p
                    className="text-[12px] mt-0.5 truncate"
                    style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}
                  >
                    {appt.service} · {appt.duration}
                  </p>
                </div>
                {/* Valor + status */}
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
                  >
                    {appt.price}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      background: appt.status === "confirmed" ? "rgba(78,122,74,0.12)" : "rgba(201,160,32,0.12)",
                      color: appt.status === "confirmed" ? "#4E7A4A" : "#C9A020",
                      fontFamily: "var(--font-manrope)",
                    }}
                  >
                    {appt.status === "confirmed" ? "Confirmado" : "Pendente"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
