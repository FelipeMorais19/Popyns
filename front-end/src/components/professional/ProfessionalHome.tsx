"use client";

import { useState, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { ServiceInProgress } from "./ServiceInProgress";
import {
  IconHome,
  IconCalendar,
  IconArrowRight,
  IconUser,
} from "../onboarding/icons";
import { ProfessionalProfile } from "./ProfessionalProfile";
import { ProfessionalAgenda } from "./ProfessionalAgenda";
import { ProfessionalGanhos } from "./ProfessionalGanhos";

// === Icons exclusivos desta tela ===
const IconBell = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconPower = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

const IconDollar = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconStar = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// === Mock data (TODO: ligar em Supabase quando o schema existir) ===
const MOCK = {
  earningsToday: 340,
  earningsDeltaValue: 52,
  appointmentsToday: 4,
  appointmentsDeltaVsYesterday: 2,
  nextAppointment: {
    name: "Camila Machado",
    initial: "C",
    serviceName: "Manicure em gel",
    price: "R$ 85",           // valor cobrado da cliente
    netPrice: "R$ 72,25",    // repasse para a profissional após taxa de 15% da plataforma
    duration: "1h30",
    time: "14:30",
    neighborhood: "Jardins",
    distance: "0,8 km",
    date: "Hoje, 12 jun",
    address: "Av. Paulista, 1000 — Apto 42, Jardins, São Paulo",
    phone: "(11) 99999-0000",
    paymentMethod: "Pix",
    status: "confirmed" as const,
  },
  seals: { current: 4, total: 5, progress: 80, reviewsMissing: 11 },
  week: {
    bars: [40, 65, 50, 80, 95, 70, 45],
    toReceive: 1840,
    payoutEstimate: 1564,
  },
};

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function greetingForHour(h: number) {
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 0 });

type TabKey = "home" | "agenda" | "ganhos" | "perfil";

export function ProfessionalHome() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const [online, setOnline] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);
  const [arrivalNotified, setArrivalNotified] = useState(false);
  const [serviceInProgress, setServiceInProgress] = useState(false);

  const greeting = greetingForHour(new Date().getHours());
  // getDay(): 0=Dom, 1=Seg, ..., 6=Sáb — coincide com a nova ordem do array
  const todayIdx = new Date().getDay();
  const firstName = user?.firstName ?? "linda";
  const avatarUrl = user?.imageUrl;
  const initial = (firstName || "?").charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setMenuOpen(false);
    try {
      await signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleBackToClient = async () => {
    setMenuOpen(false);
    if (!user) return;
    try {
      await user.update({
        unsafeMetadata: { ...user.unsafeMetadata, tipo: "cliente" },
      });
      window.location.reload();
    } catch (err) {
      console.error("Error switching back to cliente:", err);
    }
  };

  return (
    <div className="absolute inset-0 z-30 overflow-hidden bg-warm-gradient">
      {activeTab === "perfil" ? (
        <div className="h-full" style={{ paddingBottom: "100px" }}>
          <ProfessionalProfile />
        </div>
      ) : activeTab === "agenda" ? (
        <div className="h-full" style={{ paddingBottom: "100px" }}>
          <ProfessionalAgenda />
        </div>
      ) : activeTab === "ganhos" ? (
        <div className="h-full" style={{ paddingBottom: "100px" }}>
          <ProfessionalGanhos />
        </div>
      ) : null}
      <div
        className="h-full overflow-y-auto"
        style={{ display: (activeTab === "perfil" || activeTab === "agenda" || activeTab === "ganhos") ? "none" : undefined, paddingBottom: "120px" }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 pt-6 pb-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Abrir menu da conta"
              aria-expanded={menuOpen}
              className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-full"
              style={{ background: "var(--wine-800)" }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={firstName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center text-[18px]"
                  style={{
                    color: "var(--cream-100)",
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 500,
                  }}
                >
                  {initial}
                </span>
              )}
            </button>
            <div className="leading-tight">
              <p
                className="text-[11px] uppercase"
                style={{
                  color: "var(--ink-500)",
                  letterSpacing: "0.06em",
                  fontFamily: "var(--font-manrope)",
                }}
              >
                {greeting},
              </p>
              <p
                className="text-[14px] font-bold"
                style={{
                  color: "var(--ink-900)",
                  fontFamily: "var(--font-manrope)",
                }}
              >
                {firstName}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Notificações"
            className="p-1"
            style={{ color: "var(--wine-800)" }}
            onClick={() => {
              /* TODO: notifications */
            }}
          >
            <IconBell size={20} />
          </button>

          {/* Avatar menu */}
          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                />
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="absolute left-6 top-[68px] z-50 w-[230px] rounded-2xl border bg-white/95 p-2 shadow-[0_18px_40px_-20px_rgba(31,16,20,0.35)] backdrop-blur"
                  style={{ borderColor: "rgba(92,3,49,0.08)" }}
                >
                  <button
                    type="button"
                    onClick={handleBackToClient}
                    className="block w-full rounded-xl px-3 py-2.5 text-left text-[12px] font-bold uppercase tracking-wider hover:bg-[rgba(92,3,49,0.05)]"
                    style={{
                      color: "var(--ink-500)",
                      fontFamily: "var(--font-manrope)",
                    }}
                  >
                    Voltar p/ Cliente (Dev)
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="mt-1 block w-full rounded-xl px-3 py-2.5 text-left text-[12px] font-bold uppercase tracking-wider hover:bg-[rgba(92,3,49,0.05)]"
                    style={{
                      color: "var(--wine-800)",
                      fontFamily: "var(--font-manrope)",
                    }}
                  >
                    Sair da Conta
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Status Online Card */}
        <div
          className="mx-6 mt-4 flex items-center gap-4 rounded-[24px] p-[18px]"
          style={{
            background: online
              ? "linear-gradient(135deg, #5C0331 0%, #3D0220 100%)"
              : "linear-gradient(135deg, #4A3A40 0%, #2E2226 100%)",
            color: "var(--cream-100)",
          }}
        >
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            style={{
              border: `2px solid ${online ? "#4E7A4A" : "rgba(245,239,230,0.25)"}`,
              background: online
                ? "rgba(78,122,74,0.25)"
                : "rgba(245,239,230,0.08)",
              color: online ? "#A5D49F" : "rgba(245,239,230,0.55)",
            }}
          >
            <IconPower size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              style={{
                fontFamily: "var(--font-manrope)",
                fontSize: "17px",
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              {online ? "Você está online" : "Você está offline"}
            </h2>
            <p
              className="mt-1 text-[12px]"
              style={{
                fontFamily: "var(--font-manrope)",
                fontWeight: 500,
                color: online ? "rgba(245, 239, 230, 0.75)" : "rgba(245, 239, 230, 0.55)",
              }}
            >
              {online
                ? "Aceitando pedidos · raio 5 km"
                : "Toque para começar a receber pedidos"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOnline((v) => !v)}
            aria-pressed={online}
            aria-label={online ? "Ficar offline" : "Ficar online"}
            className="relative h-8 w-14 shrink-0 rounded-full transition-colors"
            style={{
              background: online
                ? "rgba(78,122,74,0.45)"
                : "rgba(245,239,230,0.18)",
              border: `1px solid ${
                online ? "rgba(78,122,74,0.4)" : "rgba(245,239,230,0.25)"
              }`,
            }}
          >
            <span
              className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full transition-all"
              style={{
                background: online ? "#A5D49F" : "rgba(245,239,230,0.85)",
                left: online ? "calc(100% - 28px)" : "4px",
              }}
            />
          </button>
        </div>

        {/* Scroll content */}
        <div className="px-6 pt-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex h-[110px] flex-col justify-between rounded-[20px] bg-white/85 p-4">
              <p
                className="text-[11px] font-bold uppercase"
                style={{
                  color: "var(--ink-500)",
                  letterSpacing: "0.1em",
                  fontFamily: "var(--font-manrope)",
                }}
              >
                Ganhos hoje
              </p>
              <div>
                <p
                  className="mt-1"
                  style={{
                    color: "var(--wine-900)",
                    fontFamily: "var(--font-manrope)",
                    fontSize: 30,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  R$ {BRL(MOCK.earningsToday)}
                </p>
                <p
                  className="mt-1 text-[12px] font-semibold"
                  style={{
                    color: "var(--success-700)",
                    fontFamily: "var(--font-manrope)",
                  }}
                >
                  +R$ {BRL(MOCK.earningsDeltaValue)} vs ontem ↑
                </p>
              </div>
            </div>
            <div className="flex h-[110px] flex-col justify-between rounded-[20px] bg-white/85 p-4">
              <p
                className="text-[11px] font-bold uppercase"
                style={{
                  color: "var(--ink-500)",
                  letterSpacing: "0.1em",
                  fontFamily: "var(--font-manrope)",
                }}
              >
                Atendimentos hoje
              </p>
              <div>
                <p
                  className="mt-1"
                  style={{
                    color: "var(--wine-900)",
                    fontFamily: "var(--font-manrope)",
                    fontSize: 30,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {MOCK.appointmentsToday}
                </p>
                <p
                  className="mt-1 text-[12px] font-semibold"
                  style={{
                    color: "var(--success-700)",
                    fontFamily: "var(--font-manrope)",
                  }}
                >
                  +{MOCK.appointmentsDeltaVsYesterday} vs ontem ↑
                </p>
              </div>
            </div>
          </div>

          {/* Próximo atendimento */}
          <p
            className="mt-[18px] mb-2 text-[11px] font-bold uppercase"
            style={{
              color: "var(--wine-800)",
              letterSpacing: "0.1em",
              fontFamily: "var(--font-manrope)",
            }}
          >
            Próximo atendimento
          </p>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[22px] p-[14px] text-left active:scale-[0.995] transition-transform"
            style={{
              background: "var(--wine-800)",
              color: "var(--cream-100)",
            }}
            onClick={() => setShowAppointmentDetail(true)}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "rgba(245,239,230,0.18)",
                border: "1px solid rgba(245,239,230,0.35)",
                color: "var(--cream-100)",
                fontFamily: "var(--font-cormorant)",
                fontSize: 18,
              }}
            >
              {MOCK.nextAppointment.initial}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[14px] font-bold"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                {MOCK.nextAppointment.name}
              </p>
              <p
                className="text-[12px]"
                style={{
                  opacity: 0.7,
                  fontFamily: "var(--font-manrope)",
                }}
              >
                {MOCK.nextAppointment.serviceName} · {MOCK.nextAppointment.netPrice} · {MOCK.nextAppointment.duration}
              </p>
              <p
                className="text-[12px]"
                style={{
                  color: "var(--rose-200)",
                  fontFamily: "var(--font-manrope)",
                }}
              >
                {MOCK.nextAppointment.time} · {MOCK.nextAppointment.neighborhood} · {MOCK.nextAppointment.distance}
              </p>
            </div>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "var(--cream-100)",
                color: "var(--wine-800)",
              }}
            >
              <IconArrowRight size={16} />
            </div>
          </button>

          {/* Selos */}
          <button
            type="button"
            className="mt-[22px] block w-full rounded-[22px] bg-white/85 p-4 text-left active:scale-[0.995] transition-transform"
            onClick={() => {
              /* TODO: tela de progresso dos selos */
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-[11px] font-bold uppercase"
                  style={{
                    color: "var(--wine-800)",
                    letterSpacing: "0.1em",
                    fontFamily: "var(--font-manrope)",
                  }}
                >
                  Seus selos POPYNS
                </p>
                <p
                  className="mt-1"
                  style={{
                    color: "var(--wine-900)",
                    fontFamily: "var(--font-manrope)",
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {MOCK.seals.current} de {MOCK.seals.total}
                </p>
              </div>
              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold uppercase"
                style={{
                  background:
                    "linear-gradient(135deg, #5C0331 0%, #3D0220 100%)",
                  color: "var(--cream-100)",
                  letterSpacing: "0.06em",
                  fontFamily: "var(--font-manrope)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/popyns-glifo-creme.png" alt="" aria-hidden="true" width={14} height={14} style={{ objectFit: "contain" }} />
                {MOCK.seals.current}/{MOCK.seals.total}
              </div>
            </div>
          </button>

          {/* Esta semana */}
          <div className="mt-[22px] mb-2 flex items-center justify-between">
            <p
              className="text-[11px] font-bold uppercase"
              style={{
                color: "var(--wine-800)",
                letterSpacing: "0.1em",
                fontFamily: "var(--font-manrope)",
              }}
            >
              Esta semana
            </p>
            <button
              type="button"
              className="text-[12px] font-semibold"
              style={{
                color: "var(--wine-800)",
                fontFamily: "var(--font-manrope)",
              }}
              onClick={() => {
                /* TODO: ganhos completos */
              }}
            >
              Ver tudo →
            </button>
          </div>
          <div className="rounded-[22px] bg-white/85 p-4">
            {/* Bars */}
            <div className="flex h-20 items-end gap-2">
              {MOCK.week.bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-[6px]"
                  style={{
                    height: `${h}%`,
                    background:
                      i === todayIdx
                        ? "var(--wine-800)"
                        : "rgba(92,3,49,0.18)",
                  }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex gap-2">
              {WEEK_DAYS.map((d, i) => (
                <span
                  key={i}
                  className="flex-1 text-center text-[10px] uppercase"
                  style={{
                    color: "var(--ink-500)",
                    letterSpacing: "0.08em",
                    fontFamily: "var(--font-manrope)",
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p
                  className="text-[11px] font-bold uppercase"
                  style={{
                    color: "var(--ink-500)",
                    letterSpacing: "0.1em",
                    fontFamily: "var(--font-manrope)",
                  }}
                >
                  Repasse
                </p>
                <p
                  style={{
                    color: "var(--wine-800)",
                    fontFamily: "var(--font-manrope)",
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  R$ {BRL(MOCK.week.toReceive)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-[11px] font-bold uppercase"
                  style={{
                    color: "var(--ink-500)",
                    letterSpacing: "0.1em",
                    fontFamily: "var(--font-manrope)",
                  }}
                >
                  A receber
                </p>
                <p
                  style={{
                    color: "var(--success-700)",
                    fontFamily: "var(--font-manrope)",
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  R$ {BRL(MOCK.week.payoutEstimate)}
                </p>
              </div>
            </div>
          </div>

          {/* Dev settings */}
          <div
            className="mt-[22px] flex flex-col gap-3 rounded-[22px] border bg-white/30 p-4"
            style={{ borderColor: "rgba(92,3,49,0.06)" }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{
                color: "rgba(92,3,49,0.4)",
                fontFamily: "var(--font-manrope)",
              }}
            >
              Ambiente de Testes (Dev)
            </span>
            <button
              type="button"
              onClick={handleBackToClient}
              className="h-9 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-[rgba(92,3,49,0.05)]"
              style={{
                borderColor: "rgba(92,3,49,0.15)",
                color: "var(--ink-500)",
                fontFamily: "var(--font-manrope)",
              }}
            >
              Voltar para Conta Cliente
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar flutuante */}
      <div className="absolute bottom-7 left-1/2 z-40 -translate-x-1/2">
        <div
          className="flex items-center gap-1 rounded-full p-2 shadow-[0_18px_36px_-18px_rgba(31,16,20,0.45)]"
          style={{ background: "var(--wine-900)" }}
        >
          {(
            [
              { key: "home", Icon: IconHome, label: "Início" },
              { key: "agenda", Icon: IconCalendar, label: "Agenda" },
              { key: "ganhos", Icon: IconDollar, label: "Ganhos" },
              { key: "perfil", Icon: IconUser, label: "Perfil" },
            ] as const
          ).map(({ key, Icon, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className="flex h-10 items-center justify-center rounded-full transition-all"
                style={{
                  width: active ? 52 : 40,
                  background: active
                    ? "linear-gradient(135deg, #D9A89E 0%, #C28A7E 100%)"
                    : "transparent",
                  color: active ? "var(--wine-900)" : "rgba(245,239,230,0.7)",
                }}
                aria-label={label}
                aria-pressed={active}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Tela de detalhe do atendimento */}
      <AnimatePresence>
        {showAppointmentDetail && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="absolute inset-0 z-50 overflow-y-auto bg-warm-gradient"
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 pt-6 pb-4"
              style={{ background: "var(--wine-800)" }}
            >
              <button
                type="button"
                onClick={() => setShowAppointmentDetail(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(245,239,230,0.15)", color: "var(--cream-100)" }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
              <div>
                <p className="text-[11px] uppercase tracking-wider opacity-60" style={{ color: "var(--cream-100)", fontFamily: "var(--font-manrope)" }}>Atendimento</p>
                <p className="text-[15px] font-bold" style={{ color: "var(--cream-100)", fontFamily: "var(--font-manrope)" }}>{MOCK.nextAppointment.date}</p>
              </div>
              <span
                className="ml-auto rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                style={{ background: "rgba(78,122,74,0.35)", color: "#A5D49F", fontFamily: "var(--font-manrope)" }}
              >
                Confirmado
              </span>
            </div>

            <div className="flex flex-col gap-4 px-5 pt-5 pb-10 max-w-[420px] mx-auto">

              {/* Cliente */}
              <div
                className="flex items-center gap-4 rounded-[22px] p-5 bg-white/70 border"
                style={{ borderColor: "rgba(92,3,49,0.08)" }}
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[22px]"
                  style={{ background: "var(--wine-800)", color: "var(--cream-100)", fontFamily: "var(--font-cormorant)" }}
                >
                  {MOCK.nextAppointment.initial}
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(92,3,49,0.5)", fontFamily: "var(--font-manrope)" }}>Cliente</p>
                  <p className="text-[16px] font-bold" style={{ color: "var(--wine-900)", fontFamily: "var(--font-manrope)" }}>{MOCK.nextAppointment.name}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}>{MOCK.nextAppointment.phone}</p>
                </div>
              </div>

              {/* Serviço */}
              <div className="rounded-[22px] p-5 bg-white/70 border flex flex-col gap-3" style={{ borderColor: "rgba(92,3,49,0.08)" }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}>Serviço</p>
                <DetailRow label="Serviço" value={MOCK.nextAppointment.serviceName} />
                <DetailRow label="Duração média" value={`~${MOCK.nextAppointment.duration}`} />
                <DetailRow label="Valor" value={MOCK.nextAppointment.netPrice} highlight />
              </div>

              {/* Local e horário */}
              <div className="rounded-[22px] p-5 bg-white/70 border flex flex-col gap-3" style={{ borderColor: "rgba(92,3,49,0.08)" }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}>Local e horário</p>
                <DetailRow label="Data" value={MOCK.nextAppointment.date} />
                <DetailRow label="Horário" value={MOCK.nextAppointment.time} />
                <DetailRow label="Endereço" value={MOCK.nextAppointment.address} />
                <DetailRow label="Distância" value={MOCK.nextAppointment.distance} />
              </div>

              {/* Ações */}
              {arrivalNotified ? (
                <div
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border text-[13px] font-bold uppercase tracking-wider"
                  style={{ borderColor: "rgba(92,3,49,0.2)", color: "rgba(92,3,49,0.45)", fontFamily: "var(--font-manrope)", background: "rgba(92,3,49,0.04)" }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Cliente notificada
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    // TODO: chamar endpoint de push notification para a cliente
                    setArrivalNotified(true);
                  }}
                  className="h-12 w-full rounded-[16px] text-[13px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                  style={{ background: "var(--wine-800)", color: "var(--cream-100)", fontFamily: "var(--font-manrope)" }}
                >
                  Notificar chegada
                </button>
              )}
              <a
                href={`tel:${MOCK.nextAppointment.phone.replace(/\D/g, "")}`}
                className="flex h-12 w-full items-center justify-center rounded-[16px] border text-[13px] font-bold uppercase tracking-wider transition-colors"
                style={{ borderColor: "rgba(92,3,49,0.2)", color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
              >
                Entrar em Contato
              </a>
              <SlideToStart
                onConfirm={() => { setShowAppointmentDetail(false); setServiceInProgress(true); }}
              />

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {serviceInProgress && (
          <ServiceInProgress
            serviceName={MOCK.nextAppointment.serviceName}
            clientName={MOCK.nextAppointment.name}
            durationLabel={MOCK.nextAppointment.duration}
            netPrice={MOCK.nextAppointment.netPrice}
            onFinished={() => { setServiceInProgress(false); setArrivalNotified(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SlideToStart({ onConfirm }: { onConfirm: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [fillPct, setFillPct] = useState(0);
  const controls = useAnimation();

  function handleDrag(_: unknown, info: { offset: { x: number } }) {
    if (!trackRef.current) return;
    const maxX = trackRef.current.offsetWidth - 64;
    setFillPct(Math.min(100, Math.max(0, (info.offset.x / maxX) * 100)));
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (!trackRef.current) return;
    const maxX = trackRef.current.offsetWidth - 64;
    if (info.offset.x >= maxX * 0.82) {
      onConfirm();
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 35 } });
      setFillPct(0);
    }
  }

  return (
    <div
      ref={trackRef}
      className="relative h-[60px] w-full overflow-hidden rounded-2xl select-none"
      style={{ background: "var(--wine-800)" }}
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{ width: `${fillPct}%`, background: "rgba(255,255,255,0.1)", transition: "width 16ms linear" }}
      />
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center pl-16 text-[12px] font-bold uppercase tracking-[0.12em]"
        style={{ color: `rgba(255,255,255,${Math.max(0.1, 0.45 - (fillPct / 100) * 0.38)})`, fontFamily: "var(--font-manrope)" }}
      >
        Iniciar atendimento
      </span>
      <motion.div
        drag="x"
        dragConstraints={trackRef}
        dragElastic={0}
        dragMomentum={false}
        animate={controls}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.07 }}
        className="absolute top-[6px] left-[6px] z-10 flex h-[48px] w-[48px] cursor-grab items-center justify-center rounded-full active:cursor-grabbing"
        style={{ background: "white", color: "var(--wine-800)", boxShadow: "0 4px 16px rgba(92,3,49,0.35)", touchAction: "none" }}
      >
        <IconArrowRight size={20} />
      </motion.div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[11px] shrink-0" style={{ color: "rgba(92,3,49,0.5)", fontFamily: "var(--font-manrope)" }}>{label}</span>
      <span
        className="text-[13px] font-semibold text-right"
        style={{ color: highlight ? "var(--wine-800)" : "var(--wine-900)", fontFamily: "var(--font-manrope)", fontWeight: highlight ? 700 : 600 }}
      >
        {value}
      </span>
    </div>
  );
}
