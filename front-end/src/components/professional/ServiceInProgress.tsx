"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { IconArrowRight } from "../onboarding/icons";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDuration(label: string): number {
  const hMatch = label.match(/(\d+)h/);
  const mAfterH = label.match(/h(\d+)/);
  const minMatch = label.match(/(\d+)min/);
  const hours = hMatch ? parseInt(hMatch[1]) : 0;
  const mins = mAfterH ? parseInt(mAfterH[1]) : minMatch ? parseInt(minMatch[1]) : 0;
  return (hours * 60 + mins) * 60 || 5400;
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = sec.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ── Slide to Finish ───────────────────────────────────────────────────────────

function SlideToFinish({ onConfirm }: { onConfirm: () => void }) {
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
        style={{
          color: `rgba(255,255,255,${Math.max(0.1, 0.45 - (fillPct / 100) * 0.38)})`,
          fontFamily: "var(--font-manrope)",
        }}
      >
        Finalizar atendimento
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
        style={{
          background: "white",
          color: "var(--wine-800)",
          boxShadow: "0 4px 16px rgba(92,3,49,0.35)",
          touchAction: "none",
        }}
      >
        <IconArrowRight size={20} />
      </motion.div>
    </div>
  );
}

// ── Report Modal ──────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  "Comportamento inadequado ou desrespeitoso",
  "Cliente não estava no endereço combinado",
  "Local inadequado para realizar o serviço",
  "Solicitação de serviço não contratado",
  "Suspeita de golpe ou fraude",
  "Outro motivo",
];

function ReportModal({ onClose, onFinished }: { onClose: () => void; onFinished: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = !!selected && (selected !== "Outro motivo" || other.trim().length > 0);

  function handleSubmit() {
    // TODO: enviar reporte via backend
    setSubmitted(true);
    setTimeout(onFinished, 1800);
  }

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        className="relative z-10 flex flex-col rounded-t-3xl px-6 pb-10 pt-6 gap-4"
        style={{ background: "#FAF6F1" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
      >
        {submitted ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "rgba(92,3,49,0.08)" }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--wine-800)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="text-[16px] font-bold" style={{ color: "var(--wine-900)", fontFamily: "var(--font-manrope)" }}>
              Reporte enviado
            </p>
            <p className="text-center text-[13px]" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)", lineHeight: 1.5 }}>
              Nossa equipe irá analisar o caso em breve.
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}>
                Reportar cliente
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)", lineHeight: 1.5 }}>
                Selecione o motivo do reporte:
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelected(reason)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] transition-colors"
                  style={{
                    background: selected === reason ? "rgba(92,3,49,0.05)" : "white",
                    border: `1.5px solid ${selected === reason ? "var(--wine-800)" : "rgba(92,3,49,0.1)"}`,
                    color: "var(--wine-900)",
                    fontFamily: "var(--font-manrope)",
                    fontWeight: 500,
                  }}
                >
                  <div
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                    style={{ borderColor: selected === reason ? "var(--wine-800)" : "rgba(92,3,49,0.25)" }}
                  >
                    {selected === reason && (
                      <div className="h-2 w-2 rounded-full" style={{ background: "var(--wine-800)" }} />
                    )}
                  </div>
                  {reason}
                </button>
              ))}
            </div>

            {selected === "Outro motivo" && (
              <input
                type="text"
                placeholder="Descreva o motivo..."
                value={other}
                onChange={(e) => setOther(e.target.value)}
                className="h-12 w-full rounded-full px-5 text-[14px] outline-none"
                style={{ border: "1.5px solid rgba(92,3,49,0.15)", color: "var(--ink-900)", fontFamily: "var(--font-manrope)" }}
              />
            )}

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="h-12 w-full rounded-[16px] text-[13px] font-bold uppercase tracking-wider transition-all disabled:opacity-40"
              style={{ background: "var(--wine-800)", color: "white", fontFamily: "var(--font-manrope)" }}
            >
              Enviar reporte
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────

const CANCEL_REASONS = [
  "Emergência pessoal ou familiar",
  "Problema de saúde",
  "Problema de transporte ou deslocamento",
  "Conflito de horário",
  "Condições do local inadequadas para o serviço",
  "Outro motivo",
];

function CancelModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const canSubmit = !!selected && (selected !== "Outro motivo" || other.trim().length > 0);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        className="relative z-10 flex flex-col rounded-t-3xl px-6 pb-10 pt-6 gap-4"
        style={{ background: "#FAF6F1" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgb(185,28,28)", fontFamily: "var(--font-manrope)" }}>
            Cancelar atendimento
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)", lineHeight: 1.5 }}>
            Selecione o motivo do cancelamento:
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {CANCEL_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelected(reason)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] transition-colors"
              style={{
                background: selected === reason ? "rgba(220,38,38,0.05)" : "white",
                border: `1.5px solid ${selected === reason ? "rgb(185,28,28)" : "rgba(220,38,38,0.15)"}`,
                color: "var(--wine-900)",
                fontFamily: "var(--font-manrope)",
                fontWeight: 500,
              }}
            >
              <div
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                style={{ borderColor: selected === reason ? "rgb(185,28,28)" : "rgba(220,38,38,0.3)" }}
              >
                {selected === reason && (
                  <div className="h-2 w-2 rounded-full" style={{ background: "rgb(185,28,28)" }} />
                )}
              </div>
              {reason}
            </button>
          ))}
        </div>

        {selected === "Outro motivo" && (
          <input
            type="text"
            placeholder="Descreva o motivo..."
            value={other}
            onChange={(e) => setOther(e.target.value)}
            className="h-12 w-full rounded-full px-5 text-[14px] outline-none"
            style={{ border: "1.5px solid rgba(220,38,38,0.2)", color: "var(--ink-900)", fontFamily: "var(--font-manrope)" }}
          />
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={onConfirm}
          className="h-12 w-full rounded-[16px] text-[13px] font-bold uppercase tracking-wider transition-all disabled:opacity-40"
          style={{ background: "rgb(185,28,28)", color: "white", fontFamily: "var(--font-manrope)" }}
        >
          Confirmar cancelamento
        </button>

        <button
          type="button"
          onClick={onClose}
          className="text-center text-[12px] font-semibold underline underline-offset-4"
          style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}
        >
          Voltar ao atendimento
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type ServiceInProgressProps = {
  serviceName: string;
  clientName: string;
  durationLabel: string;
  netPrice: string;
  onFinished: () => void;
};

export function ServiceInProgress({
  serviceName,
  clientName,
  durationLabel,
  netPrice,
  onFinished,
}: ServiceInProgressProps) {
  const totalSeconds = parseDuration(durationLabel);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [showReport, setShowReport] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0 || finishing) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft, finishing]);

  useEffect(() => {
    if (secondsLeft === 0 && !finishing && !showTimeUp) setShowTimeUp(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  function handleFinish() {
    setFinishing(true);
    setTimeout(onFinished, 2400);
  }

  const progress = (totalSeconds - secondsLeft) / totalSeconds;
  const R = 118;
  const C = 2 * Math.PI * R;
  const dashOffset = C * (1 - progress);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col overflow-hidden bg-warm-gradient"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: "spring", stiffness: 360, damping: 36 }}
    >
      {/* Header wine */}
      <div
        className="flex flex-col px-6 pt-12 pb-6"
        style={{ background: "var(--wine-800)" }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-manrope)" }}
        >
          Em atendimento
        </p>
        <p
          className="mt-1 leading-tight"
          style={{ fontFamily: "var(--font-cormorant)", fontSize: 26, fontWeight: 500, color: "var(--cream-100)" }}
        >
          {clientName}
        </p>
        <p
          className="mt-1 text-[12px]"
          style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-manrope)" }}
        >
          {serviceName} · {netPrice}
        </p>
      </div>

      {/* Timer */}
      <div className="flex flex-1 items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg width={300} height={300} viewBox="0 0 300 300" style={{ overflow: "visible" }}>
            {/* Track */}
            <circle
              cx={150} cy={150} r={R}
              fill="none"
              stroke="rgba(92,3,49,0.1)"
              strokeWidth={13}
            />
            {/* Progress */}
            <circle
              cx={150} cy={150} r={R}
              fill="none"
              stroke="var(--wine-800)"
              strokeWidth={13}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 150 150)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>

          <div className="absolute flex flex-col items-center gap-1.5">
            <span
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: 58,
                fontWeight: 500,
                color: "var(--wine-900)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {formatTime(secondsLeft)}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}
            >
              {secondsLeft > 0 ? "restante" : "tempo encerrado"}
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 px-6 pb-10">
        <button
          type="button"
          onClick={() => setShowReport(true)}
          className="flex h-12 w-full items-center justify-center rounded-[16px] border text-[13px] font-bold uppercase tracking-wider transition-colors active:scale-[0.98]"
          style={{ borderColor: "rgba(92,3,49,0.2)", color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
        >
          Reportar
        </button>

        <button
          type="button"
          onClick={() => setShowCancel(true)}
          className="flex h-12 w-full items-center justify-center rounded-[16px] border text-[13px] font-bold uppercase tracking-wider transition-colors active:scale-[0.98]"
          style={{ borderColor: "rgba(220,38,38,0.25)", color: "rgb(185,28,28)", fontFamily: "var(--font-manrope)" }}
        >
          Cancelar atendimento
        </button>

        <SlideToFinish onConfirm={handleFinish} />
      </div>

      {/* Modal tempo esgotado */}
      <AnimatePresence>
        {showTimeUp && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              className="relative z-10 flex flex-col rounded-t-3xl px-6 pb-10 pt-8 gap-5"
              style={{ background: "#FAF6F1" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
            >
              <div className="flex flex-col items-center gap-3 pb-2">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: "rgba(92,3,49,0.08)" }}
                >
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="var(--wine-800)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <p
                  style={{ fontFamily: "var(--font-cormorant)", fontSize: 24, fontWeight: 500, color: "var(--wine-900)", lineHeight: 1.1, textAlign: "center" }}
                >
                  Tempo esgotado!
                </p>
                <p
                  className="text-center text-[13px]"
                  style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)", lineHeight: 1.5 }}
                >
                  O tempo estimado do atendimento acabou.{"\n"}Deseja continuar ou finalizar agora?
                </p>
              </div>

              <button
                type="button"
                onClick={() => { setShowTimeUp(false); setSecondsLeft(0); }}
                className="h-12 w-full rounded-[16px] text-[13px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                style={{ background: "var(--wine-800)", color: "white", fontFamily: "var(--font-manrope)" }}
              >
                Continuar atendimento
              </button>

              <button
                type="button"
                onClick={() => { setShowTimeUp(false); handleFinish(); }}
                className="flex h-12 w-full items-center justify-center rounded-[16px] border text-[13px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                style={{ borderColor: "rgba(92,3,49,0.2)", color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
              >
                Finalizar agora
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showReport && (
          <ReportModal
            onClose={() => setShowReport(false)}
            onFinished={() => { setShowReport(false); handleFinish(); }}
          />
        )}
        {showCancel && (
          <CancelModal
            onClose={() => setShowCancel(false)}
            onConfirm={() => {
              setShowCancel(false);
              setFinishing(true);
              setTimeout(onFinished, 100);
            }}
          />
        )}
      </AnimatePresence>

      {/* Completion overlay */}
      <AnimatePresence>
        {finishing && (
          <motion.div
            className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-6"
            style={{ background: "var(--wine-800)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.15 }}
              className="flex h-24 w-24 items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </motion.div>

            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <p
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: 32,
                  fontWeight: 500,
                  color: "var(--cream-100)",
                  lineHeight: 1.1,
                }}
              >
                Atendimento finalizado!
              </p>
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-manrope)" }}
              >
                Ótimo trabalho! 🌸
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
