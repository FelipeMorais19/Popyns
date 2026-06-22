"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase";

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

type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed";

interface AgendaAppointment {
  id: string;
  date: string;
  time: string;
  clientName: string;
  service: string;
  status: AppointmentStatus;
  price: string;
  duration: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

function mapDbStatus(status: string): AppointmentStatus {
  if (["accepted", "on_the_way", "in_progress", "arrived"].includes(status)) return "confirmed";
  if (status === "completed") return "completed";
  if (["cancelled", "rejected", "expired"].includes(status)) return "cancelled";
  return "pending";
}

const STATUS_STYLE: Record<AppointmentStatus, { dot: string; divider: string; bg: string; text: string; label: string }> = {
  confirmed: { dot: "#D4547A", divider: "rgba(212,84,122,0.35)", bg: "rgba(212,84,122,0.12)", text: "#C44170", label: "Confirmado" },
  pending:   { dot: "#C9A020", divider: "rgba(201,160,32,0.35)", bg: "rgba(201,160,32,0.12)", text: "#C9A020", label: "Pendente"   },
  completed: { dot: "#4E7A4A", divider: "rgba(78,122,74,0.35)",  bg: "rgba(78,122,74,0.12)",  text: "#4E7A4A", label: "Concluído"  },
  cancelled: { dot: "#E05252", divider: "rgba(224,82,82,0.35)",  bg: "rgba(224,82,82,0.12)",  text: "#C53030", label: "Cancelado"  },
};

// Mock fallback — usado quando a profissional não tem bookings reais ainda
// 4 dias com pelo menos 1 de cada status para visualização
const MOCK_APPOINTMENTS: AgendaAppointment[] = [
  // 12/jun — concluídos (passados) + 1 cancelado
  { id: "1",  date: "2026-06-12", time: "09:00", clientName: "Camila Machado",  service: "Manicure em gel",    status: "completed", price: "R$ 85",  duration: "1h30" },
  { id: "2",  date: "2026-06-12", time: "11:30", clientName: "Ana Lima",        service: "Pedicure completa",  status: "completed", price: "R$ 55",  duration: "1h"   },
  { id: "3",  date: "2026-06-12", time: "14:00", clientName: "Larissa Rocha",   service: "Manicure simples",   status: "cancelled", price: "R$ 45",  duration: "45min"},
  // 16/jun (hoje) — confirmado + pendente
  { id: "4",  date: "2026-06-16", time: "09:30", clientName: "Fernanda Alves",  service: "Pedicure completa",  status: "confirmed", price: "R$ 55",  duration: "1h"   },
  { id: "5",  date: "2026-06-16", time: "11:00", clientName: "Beatriz Costa",   service: "Manicure em gel",    status: "pending",   price: "R$ 85",  duration: "1h30" },
  // 19/jun — confirmado + pendente
  { id: "6",  date: "2026-06-19", time: "10:00", clientName: "Júlia Ferreira",  service: "Manicure em gel",    status: "confirmed", price: "R$ 85",  duration: "1h30" },
  { id: "7",  date: "2026-06-19", time: "14:30", clientName: "Mariana Souza",   service: "Pé e mão completo",  status: "pending",   price: "R$ 120", duration: "2h"   },
  // 22/jun — todos os 4 status no mesmo dia
  { id: "8",  date: "2026-06-22", time: "09:00", clientName: "Sofia Lima",      service: "Manicure em gel",    status: "confirmed", price: "R$ 85",  duration: "1h30" },
  { id: "9",  date: "2026-06-22", time: "10:30", clientName: "Camila Rocha",    service: "Pedicure completa",  status: "pending",   price: "R$ 55",  duration: "1h"   },
  { id: "10", date: "2026-06-22", time: "13:00", clientName: "Helena Dias",     service: "Manicure simples",   status: "completed", price: "R$ 45",  duration: "45min"},
  { id: "11", date: "2026-06-22", time: "15:00", clientName: "Paula Menezes",   service: "Pé e mão completo",  status: "cancelled", price: "R$ 120", duration: "2h"   },
];

type RawBooking = {
  id: string;
  scheduled_at: string;
  status: string;
  total_cents: number;
  total_duration_minutes: number;
  client: { full_name: string } | null;
  booking_services: { name_snapshot: string }[];
};

export function ProfessionalAgenda() {
  const { user } = useUser();
  const supabase = useSupabase();

  const today = todayYMD();
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [appointments, setAppointments] = useState<AgendaAppointment[]>(MOCK_APPOINTMENTS);
  const [profProfileId, setProfProfileId] = useState<string | null>(null);
  const hasRealDataRef = useRef(false);

  const loadBookings = useCallback(async (profileId: string) => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        scheduled_at,
        status,
        total_cents,
        total_duration_minutes,
        client:users!client_id(full_name),
        booking_services(name_snapshot)
      `)
      .eq("professional_id", profileId)
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("[ProfessionalAgenda] Failed to load bookings:", error);
      return;
    }

    const mapped: AgendaAppointment[] = ((data ?? []) as unknown as RawBooking[]).map((bk) => {
      const dt = new Date(bk.scheduled_at);
      return {
        id: bk.id,
        date: toYMD(dt),
        time: `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`,
        clientName: bk.client?.full_name ?? "Cliente",
        service: bk.booking_services[0]?.name_snapshot ?? "Serviço",
        status: mapDbStatus(bk.status),
        price: formatPrice(bk.total_cents),
        duration: formatDuration(bk.total_duration_minutes),
      };
    });

    if (mapped.length > 0) {
      hasRealDataRef.current = true;
      setAppointments(mapped);
    } else if (!hasRealDataRef.current) {
      setAppointments(MOCK_APPOINTMENTS);
    } else {
      setAppointments([]);
    }
  }, [supabase]);

  // Carrega perfil profissional e bookings iniciais
  useEffect(() => {
    if (!user) return;

    async function init() {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user!.id)
        .maybeSingle();

      if (!userData) return;

      const { data: profData } = await supabase
        .from("professional_profiles")
        .select("id")
        .eq("user_id", userData.id)
        .maybeSingle();

      if (!profData) return;

      setProfProfileId(profData.id);
      await loadBookings(profData.id);
    }

    init();
  }, [user, supabase, loadBookings]);

  // Realtime: atualiza calendário automaticamente quando algum booking muda
  useEffect(() => {
    if (!profProfileId) return;

    const channel = supabase
      .channel(`professional-agenda-${profProfileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `professional_id=eq.${profProfileId}`,
        },
        () => {
          loadBookings(profProfileId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profProfileId, supabase, loadBookings]);

  // Build calendar grid
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const daysWithAppts = new Set(
    appointments.filter((a) => a.status !== "cancelled").map((a) => a.date)
  );

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

  const dayAppts = appointments
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

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
              <div
                key={appt.id}
                className="flex items-center gap-4 rounded-[18px] p-4 text-left w-full border bg-white/70"
                style={{ borderColor: "rgba(92,3,49,0.08)" }}
              >
                {/* Hora + indicador de status */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
                  >
                    {appt.time}
                  </span>
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: STATUS_STYLE[appt.status].dot }}
                  />
                </div>
                {/* Divisor colorido */}
                <div
                  className="w-[2px] self-stretch rounded-full shrink-0"
                  style={{ background: STATUS_STYLE[appt.status].divider }}
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
                {/* Valor + badge */}
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
                      background: STATUS_STYLE[appt.status].bg,
                      color: STATUS_STYLE[appt.status].text,
                      fontFamily: "var(--font-manrope)",
                    }}
                  >
                    {STATUS_STYLE[appt.status].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
