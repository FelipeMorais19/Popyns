"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────

type HistoricoItem = {
  id: string; date: string; time: string;
  clientName: string; clientAvatar?: string;
  service: string; duration: string;
  priceCents: number; address?: string;
};
type FilterKey = "tudo" | "hoje" | "semana" | "mes" | "3meses" | "ano";
type CalMode = "from" | "to" | null;
type RawBooking = {
  id: string; scheduled_at: string; total_cents: number; total_duration_minutes: number;
  client: { full_name: string } | null;
  booking_services: { name_snapshot: string }[];
};

// ── Constants ──────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_NAMES_FULL = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
const WEEK_LABELS = ["D","S","T","Q","Q","S","S"];
const FILTER_LABELS: Record<FilterKey, string> = { tudo:"Tudo", hoje:"Hoje", semana:"7 dias", mes:"Este mês", "3meses":"3 meses", ano:"Este ano" };
const FILTER_KEYS: FilterKey[] = ["tudo","hoje","semana","mes","3meses","ano"];

// ── Helpers ────────────────────────────────────────────────────────────────

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
}
function formatDuration(minutes: number) {
  if (!minutes) return "—";
  const h = Math.floor(minutes/60), m = minutes%60;
  return h===0 ? `${m}min` : m>0 ? `${h}h${m}min` : `${h}h`;
}
function formatFullDate(date: string, time: string) {
  const d = new Date(`${date}T${time}:00`);
  return `${DAY_NAMES_FULL[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]} de ${d.getFullYear()} às ${time}`;
}
function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g,"").slice(0,8);
  if (digits.length<=2) return digits;
  if (digits.length<=4) return `${digits.slice(0,2)}/${digits.slice(2)}`;
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
}
function brToYMD(br: string): string {
  const parts = br.split("/");
  if (parts.length!==3||parts[2].length!==4) return "";
  const [d,m,y] = parts;
  return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
}
function ymdToBR(ymd: string): string {
  if (!ymd) return "";
  const [y,m,d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

function filterByPeriod(items: HistoricoItem[], filter: FilterKey): HistoricoItem[] {
  const now = new Date();
  return items.filter((item) => {
    switch (filter) {
      case "tudo": return true;
      case "hoje": return item.date===toYMD(now);
      case "semana": { const c=new Date(now); c.setDate(now.getDate()-7); return item.date>=toYMD(c); }
      case "mes": return item.date.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
      case "3meses": { const c=new Date(now); c.setMonth(now.getMonth()-3); return item.date>=toYMD(c); }
      case "ano": return item.date.startsWith(`${now.getFullYear()}`);
    }
  });
}
function applyAllFilters(items: HistoricoItem[], opts: {
  timeFilter: FilterKey; searchQuery: string;
  serviceFilters: string[]; customRange: {from:string;to:string};
}): HistoricoItem[] {
  let r = items;
  const {from:cf,to:ct}=opts.customRange;
  if (cf||ct) { r=r.filter(i=>(cf?i.date>=cf:true)&&(ct?i.date<=ct:true)); }
  else r=filterByPeriod(r,opts.timeFilter);
  if (opts.searchQuery.trim()) { const q=opts.searchQuery.toLowerCase().trim(); r=r.filter(i=>i.clientName.toLowerCase().includes(q)); }
  if (opts.serviceFilters.length>0) r=r.filter(i=>opts.serviceFilters.includes(i.service));
  return r;
}
function groupByMonth(items: HistoricoItem[]): {label:string;items:HistoricoItem[]}[] {
  const map=new Map<string,HistoricoItem[]>();
  for (const item of items) {
    const [y,m]=item.date.split("-");
    const key=`${MONTH_NAMES[parseInt(m)-1]} ${y}`;
    if (!map.has(key)) map.set(key,[]);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([label,items])=>({label,items}));
}

// ── Mini Calendar ──────────────────────────────────────────────────────────

function MiniCalendar({ year, month, selectedYMD, todayYMD, onSelect, onPrev, onNext }: {
  year: number; month: number; selectedYMD: string; todayYMD: string;
  onSelect: (ymd: string) => void; onPrev: () => void; onNext: () => void;
}) {
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: {day:number|null;ymd:string|null}[] = [];
  for (let i=0;i<firstDay;i++) cells.push({day:null,ymd:null});
  for (let d=1;d<=daysInMonth;d++) {
    const ymd = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push({day:d,ymd});
  }
  // Always pad to 42 cells (6 rows) so the calendar never changes height
  while (cells.length < 42) cells.push({day:null,ymd:null});

  return (
    <div className="rounded-[16px] overflow-hidden mt-2" style={{border:"1px solid rgba(92,3,49,0.12)"}}>
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3" style={{background:"var(--wine-800)"}}>
        <button type="button" onClick={onPrev} className="h-7 w-7 rounded-full flex items-center justify-center" style={{background:"rgba(245,239,230,0.15)"}}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--cream-100)"}}>
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <p className="text-[13px] font-bold" style={{color:"var(--cream-100)",fontFamily:"var(--font-manrope)"}}>
          {MONTH_NAMES[month]} {year}
        </p>
        <button type="button" onClick={onNext} className="h-7 w-7 rounded-full flex items-center justify-center" style={{background:"rgba(245,239,230,0.15)"}}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--cream-100)"}}>
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
      {/* Week labels */}
      <div className="grid grid-cols-7 px-2 pt-2 pb-1" style={{background:"white"}}>
        {WEEK_LABELS.map((l,i)=>(
          <p key={i} className="text-center text-[10px] font-bold uppercase py-1" style={{color:"rgba(92,3,49,0.35)",fontFamily:"var(--font-manrope)"}}>
            {l}
          </p>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7 px-2 pb-3" style={{background:"white"}}>
        {cells.map((cell,i)=>{
          if (!cell.day||!cell.ymd) return <div key={i} className="h-8"/>;
          const isSelected = cell.ymd===selectedYMD;
          const isToday = cell.ymd===todayYMD;
          return (
            <button
              key={i} type="button" onClick={()=>onSelect(cell.ymd!)}
              className="flex items-center justify-center h-8 w-full"
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold transition-all"
                style={{
                  fontFamily:"var(--font-manrope)",
                  background: isSelected ? "var(--wine-800)" : isToday ? "rgba(92,3,49,0.1)" : "transparent",
                  color: isSelected ? "var(--cream-100)" : "var(--wine-900)",
                  fontWeight: isSelected||isToday ? 700 : 400,
                }}
              >
                {cell.day}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_HISTORICO: HistoricoItem[] = [
  {id:"h0", date:"2026-06-23",time:"08:30",clientName:"Tatiane Cruz",   service:"Pedicure em Gel",     duration:"1h30",priceCents:8500, address:"Rua Oscar Freire, 200"},
  {id:"h1", date:"2026-06-20",time:"09:00",clientName:"Camila Machado", service:"Hidratação Profunda",  duration:"45min",priceCents:6000,address:"Av. Paulista, 1000"},
  {id:"h2", date:"2026-06-18",time:"14:00",clientName:"Ana Lima",       service:"Pedicure Completa",   duration:"1h30",priceCents:7500, address:"Rua Oscar Freire, 450"},
  {id:"h3", date:"2026-06-15",time:"10:30",clientName:"Larissa Rocha",  service:"Pedicure em Gel",     duration:"1h30",priceCents:8500, address:"Al. Santos, 800"},
  {id:"h4", date:"2026-06-12",time:"16:00",clientName:"Sofia Alves",    service:"Pedicure Simples",    duration:"45min",priceCents:4500,address:"Rua da Consolação, 200"},
  {id:"h5", date:"2026-05-28",time:"11:00",clientName:"Fernanda Costa", service:"Pedicure em Gel",     duration:"1h30",priceCents:8500, address:"Av. Paulista, 1000"},
  {id:"h6", date:"2026-05-20",time:"09:30",clientName:"Beatriz Lima",   service:"Spa dos Pés",         duration:"1h",  priceCents:9000, address:"Av. Paulista, 1000"},
  {id:"h7", date:"2026-05-15",time:"14:30",clientName:"Helena Dias",    service:"Pedicure Completa",   duration:"1h30",priceCents:7500, address:"Rua Oscar Freire, 450"},
  {id:"h8", date:"2026-04-22",time:"10:00",clientName:"Paula Menezes",  service:"Pedicure em Gel",     duration:"1h30",priceCents:8500, address:"Rua da Consolação, 200"},
  {id:"h9", date:"2026-04-10",time:"15:00",clientName:"Renata Oliveira",service:"Pedicure Completa",   duration:"1h30",priceCents:7500, address:"Al. Santos, 800"},
  {id:"h10",date:"2026-03-18",time:"09:00",clientName:"Juliana Barros", service:"Spa dos Pés",         duration:"1h",  priceCents:9000, address:"Av. Paulista, 1000"},
  {id:"h11",date:"2026-03-05",time:"11:30",clientName:"Aline Fonseca",  service:"Pedicure Simples",    duration:"45min",priceCents:4500,address:"Rua Oscar Freire, 450"},
];

// ── Component ──────────────────────────────────────────────────────────────

export function ProfessionalHistorico() {
  const {user} = useUser();
  const supabase = useSupabase();
  const hasRealDataRef = useRef(false);
  const nowDate = new Date();
  const todayStr = toYMD(nowDate);

  const [items, setItems] = useState<HistoricoItem[]>(MOCK_HISTORICO);
  const [filter, setFilter] = useState<FilterKey>("tudo");
  const [searchQuery, setSearchQuery] = useState("");

  // Applied
  const [serviceFilters, setServiceFilters] = useState<string[]>([]);
  const [customRange, setCustomRange] = useState<{from:string;to:string}>({from:"",to:""});

  // Draft (sheet)
  const [draftServices, setDraftServices] = useState<string[]>([]);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  // UI
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [dropdownHovered, setDropdownHovered] = useState(false);
  const [calMode, setCalMode] = useState<CalMode>(null);
  const [calNav, setCalNav] = useState({year:nowDate.getFullYear(),month:nowDate.getMonth()});
  const [selectedItem, setSelectedItem] = useState<HistoricoItem|null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const calFromRef = useRef<HTMLDivElement>(null);
  const calToRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!serviceDropdownOpen && !calMode) return;
    function handleOutside(e: MouseEvent) {
      if (serviceDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServiceDropdownOpen(false);
      }
      if (calMode === "from" && calFromRef.current && !calFromRef.current.contains(e.target as Node)) {
        setCalMode(null);
      }
      if (calMode === "to" && calToRef.current && !calToRef.current.contains(e.target as Node)) {
        setCalMode(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [serviceDropdownOpen, calMode]);

  const loadHistorico = useCallback(async (profileId: string) => {
    const {data,error} = await supabase.from("bookings")
      .select(`id,scheduled_at,total_cents,total_duration_minutes,client:users!client_id(full_name),booking_services(name_snapshot)`)
      .eq("professional_id",profileId).eq("status","completed")
      .not("scheduled_at","is",null).order("scheduled_at",{ascending:false});
    if (error) { console.error("[ProfessionalHistorico]",error); return; }
    const mapped:HistoricoItem[] = ((data??[]) as unknown as RawBooking[]).map((bk)=>{
      const dt=new Date(bk.scheduled_at);
      return {
        id:bk.id, date:toYMD(dt),
        time:`${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`,
        clientName:bk.client?.full_name??"Cliente",
        service:bk.booking_services[0]?.name_snapshot??"Serviço",
        duration:formatDuration(bk.total_duration_minutes), priceCents:bk.total_cents,
      };
    });
    if (mapped.length>0) { hasRealDataRef.current=true; setItems(mapped); }
  },[supabase]);

  useEffect(()=>{
    if (!user) return;
    supabase.from("professional_profiles").select("id").eq("user_id",user.id).maybeSingle()
      .then(({data})=>{ if (data?.id) loadHistorico(data.id); });
  },[user,supabase,loadHistorico]);

  function openSheet() {
    setDraftServices(serviceFilters);
    setDraftFrom(ymdToBR(customRange.from));
    setDraftTo(ymdToBR(customRange.to));
    setServiceDropdownOpen(false);
    setCalMode(null);
    setCalNav({year:nowDate.getFullYear(),month:nowDate.getMonth()});
    setShowFilterSheet(true);
  }
  function applyFilters() {
    setServiceFilters(draftServices);
    const f=brToYMD(draftFrom), t=brToYMD(draftTo);
    setCustomRange({from:f,to:t});
    if (f||t) setFilter("tudo");
    setShowFilterSheet(false);
  }
  function clearFilters() {
    setDraftServices([]); setDraftFrom(""); setDraftTo("");
    setServiceFilters([]); setCustomRange({from:"",to:""});
    setSearchQuery(""); setFilter("tudo");
    setServiceDropdownOpen(false); setCalMode(null);
  }
  function toggleDraftService(s:string) {
    setDraftServices(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s]);
  }
  function handleCalSelect(ymd:string) {
    const br = ymdToBR(ymd);
    if (calMode==="from") setDraftFrom(br);
    else if (calMode==="to") setDraftTo(br);
    setCalMode(null);
  }
  function toggleCal(mode: "from"|"to") {
    if (calMode===mode) { setCalMode(null); return; }
    // Navigate calendar to show selected date if any
    const existing = mode==="from" ? brToYMD(draftFrom) : brToYMD(draftTo);
    if (existing) {
      const [y,m] = existing.split("-");
      setCalNav({year:parseInt(y),month:parseInt(m)-1});
    }
    setCalMode(mode);
  }

  const allServices = Array.from(new Set(items.map(i=>i.service))).sort();
  const hasAdvancedFilters = serviceFilters.length>0||!!(customRange.from||customRange.to);
  const filtered = applyAllFilters(items,{timeFilter:filter,searchQuery,serviceFilters,customRange});
  const grouped = groupByMonth(filtered);
  const totalCents = filtered.reduce((s,i)=>s+i.priceCents,0);
  const activeRangeLabel = (customRange.from||customRange.to)
    ? customRange.from&&customRange.to ? `${ymdToBR(customRange.from)} → ${ymdToBR(customRange.to)}`
      : customRange.from ? `A partir de ${ymdToBR(customRange.from)}`
      : `Até ${ymdToBR(customRange.to)}`
    : null;
  const serviceLabel = draftServices.length===0 ? "Todos os serviços" : draftServices.length===1 ? draftServices[0] : `${draftServices.length} serviços selecionados`;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 px-5 pt-6 pb-4" style={{background:"var(--wine-800)"}}>
        <h1 style={{fontFamily:"var(--font-cormorant)",fontStyle:"italic",fontWeight:500,fontSize:"28px",color:"var(--cream-100)",lineHeight:1.1}}>Histórico</h1>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em]" style={{color:"rgba(245,239,230,0.5)",fontFamily:"var(--font-manrope)"}}>Atendimentos Concluídos</p>

        <div className="flex items-center gap-2 mt-4">
          <div className="flex-1 flex items-center gap-2 rounded-full px-3 h-9" style={{background:"rgba(245,239,230,0.12)"}}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{color:"rgba(245,239,230,0.5)",flexShrink:0}}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Buscar cliente..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[12px] placeholder:opacity-50"
              style={{color:"var(--cream-100)",fontFamily:"var(--font-manrope)"}}/>
            {searchQuery&&<button type="button" onClick={()=>setSearchQuery("")} style={{color:"rgba(245,239,230,0.5)"}}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>}
          </div>
          <button type="button" onClick={openSheet}
            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 relative transition-all"
            style={{background:hasAdvancedFilters?"var(--cream-100)":"rgba(245,239,230,0.12)"}}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{color:hasAdvancedFilters?"var(--wine-800)":"rgba(245,239,230,0.7)"}}>
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            {hasAdvancedFilters&&<span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full" style={{background:"#D4547A",border:"2px solid var(--wine-800)"}}/>}
          </button>
        </div>

        {!activeRangeLabel&&(
          <div className="flex gap-2 mt-3" style={{overflowX:"auto",scrollbarWidth:"none",paddingBottom:"2px"}}>
            {FILTER_KEYS.map(f=>(
              <button key={f} type="button" onClick={()=>setFilter(f)}
                className="shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
                style={filter===f
                  ?{background:"var(--cream-100)",color:"var(--wine-800)",fontFamily:"var(--font-manrope)"}
                  :{background:"rgba(245,239,230,0.12)",color:"rgba(245,239,230,0.65)",fontFamily:"var(--font-manrope)"}}>
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        )}

        {activeRangeLabel&&(
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{background:"var(--cream-100)"}}>
              <span className="text-[11px] font-bold" style={{color:"var(--wine-800)",fontFamily:"var(--font-manrope)"}}>{activeRangeLabel}</span>
              <button type="button" onClick={()=>setCustomRange({from:"",to:""})}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" style={{color:"var(--wine-800)"}}><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 bg-warm-gradient px-5 pt-4 pb-10" style={{overflowY:"auto",scrollbarWidth:"none"}}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px]" style={{color:"var(--ink-500)",fontFamily:"var(--font-manrope)"}}>
            {filtered.length===0?"Nenhum atendimento":`${filtered.length} atendimento${filtered.length>1?"s":""}`}
          </p>
          {filtered.length>0&&<p className="text-[12px] font-bold" style={{color:"var(--wine-800)",fontFamily:"var(--font-manrope)"}}>{formatPrice(totalCents)}</p>}
        </div>

        {grouped.length===0?(
          <div className="flex items-center justify-center rounded-[22px] py-12 border border-dashed" style={{borderColor:"rgba(92,3,49,0.15)"}}>
            <p className="text-[13px]" style={{color:"rgba(92,3,49,0.35)",fontFamily:"var(--font-manrope)"}}>Nenhum atendimento encontrado</p>
          </div>
        ):(
          <div className="flex flex-col gap-1">
            {grouped.map(({label,items:gi},idx)=>(
              <div key={label}>
                <div className={`flex items-center gap-3 ${idx>0?"mt-5":""}  mb-3`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] shrink-0" style={{color:"rgba(92,3,49,0.45)",fontFamily:"var(--font-manrope)"}}>{label}</p>
                  <div className="flex-1 h-px" style={{background:"rgba(92,3,49,0.1)"}}/>
                </div>
                <div className="flex flex-col gap-2">
                  {gi.map(item=>(
                    <button key={item.id} type="button" onClick={()=>setSelectedItem(item)}
                      className="w-full flex items-center gap-3 rounded-[18px] p-4 border bg-white/70 text-left active:scale-[0.98] transition-all"
                      style={{borderColor:"rgba(92,3,49,0.08)"}}>
                      <div className="flex flex-col items-center gap-1 shrink-0 w-10">
                        <span className="text-[13px] font-bold" style={{color:"var(--wine-800)",fontFamily:"var(--font-manrope)"}}>{item.time}</span>
                        <span className="h-1 w-1 rounded-full" style={{background:"rgba(78,122,74,0.55)"}}/>
                      </div>
                      <div className="w-[2px] self-stretch rounded-full shrink-0" style={{background:"rgba(78,122,74,0.25)"}}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold truncate" style={{color:"var(--wine-900)",fontFamily:"var(--font-manrope)"}}>{item.clientName}</p>
                        <p className="text-[12px] mt-0.5 truncate" style={{color:"var(--ink-500)",fontFamily:"var(--font-manrope)"}}>{item.service} · {item.duration}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="text-[13px] font-bold" style={{color:"var(--wine-800)",fontFamily:"var(--font-manrope)"}}>{formatPrice(item.priceCents)}</span>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{color:"rgba(92,3,49,0.25)"}}><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Filter sheet — height fixa ── */}
      <AnimatePresence>
        {showFilterSheet&&(
          <>
            <motion.div key="filter-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="absolute inset-0 z-50" style={{background:"rgba(31,16,20,0.5)"}}
              onClick={()=>setShowFilterSheet(false)}/>
            <motion.div key="filter-drawer" initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
              transition={{type:"spring",damping:28,stiffness:280}}
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-[28px] flex flex-col"
              style={{background:"var(--cream-100)",height:"82%"}}>

              {/* Scrollable body */}
              <div className="px-6 pt-5 flex-1 overflow-y-auto" style={{scrollbarWidth:"none",position:"relative",zIndex:10}}>
                <div className="w-9 h-1 rounded-full mx-auto mb-5" style={{background:"rgba(92,3,49,0.15)"}}/>
                <p className="text-[16px] font-bold mb-5" style={{color:"var(--wine-900)",fontFamily:"var(--font-manrope)"}}>Filtros avançados</p>

                {/* Service dropdown — flutua sobre o conteúdo abaixo */}
                <div className="mb-6 relative" ref={dropdownRef}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-3" style={{color:"rgba(92,3,49,0.5)",fontFamily:"var(--font-manrope)"}}>Serviço</p>
                  <button type="button"
                    onMouseEnter={()=>setDropdownHovered(true)}
                    onMouseLeave={()=>setDropdownHovered(false)}
                    onClick={()=>{
                      if (dropdownHovered&&draftServices.length>0) { setDraftServices([]); }
                      else { setServiceDropdownOpen(v=>!v); }
                    }}
                    className="w-full flex items-center justify-between rounded-[14px] border px-4 h-11 transition-all"
                    style={{borderColor:serviceDropdownOpen?"var(--wine-800)":"rgba(92,3,49,0.2)",background:"white",fontFamily:"var(--font-manrope)",position:"relative",zIndex:10}}>
                    <span className="text-[13px] truncate" style={{color:draftServices.length>0?"var(--wine-900)":"rgba(92,3,49,0.4)"}}>
                      {serviceLabel}
                    </span>
                    {dropdownHovered&&draftServices.length>0 ? (
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{color:"rgba(92,3,49,0.55)"}}>
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    ) : (
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                        className="shrink-0 transition-transform" style={{color:"rgba(92,3,49,0.4)",transform:serviceDropdownOpen?"rotate(180deg)":"rotate(0deg)"}}>
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    )}
                  </button>
                  <AnimatePresence>
                    {serviceDropdownOpen&&(
                      <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.15}}
                        className="absolute left-0 right-0 rounded-[14px] border overflow-hidden shadow-lg"
                        style={{top:"calc(100% + 4px)",borderColor:"rgba(92,3,49,0.12)",background:"white",zIndex:20}}>
                        {allServices.map((s,i)=>{
                          const checked=draftServices.includes(s);
                          return (
                            <button key={s} type="button" onClick={()=>toggleDraftService(s)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                              style={{borderTop:i>0?"1px solid rgba(92,3,49,0.06)":undefined,background:checked?"rgba(92,3,49,0.04)":"transparent"}}>
                              <div className="h-5 w-5 rounded-[6px] flex items-center justify-center shrink-0 transition-all"
                                style={{border:`2px solid ${checked?"var(--wine-800)":"rgba(92,3,49,0.2)"}`,background:checked?"var(--wine-800)":"transparent"}}>
                                {checked&&<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                              </div>
                              <span className="text-[13px]" style={{color:"var(--wine-900)",fontFamily:"var(--font-manrope)",fontWeight:checked?600:400}}>{s}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Date range */}
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-3" style={{color:"rgba(92,3,49,0.5)",fontFamily:"var(--font-manrope)"}}>Período personalizado</p>
                  <div className="flex flex-col gap-3">
                    {/* De */}
                    <div className="relative" ref={calFromRef}>
                      <p className="text-[10px] mb-1.5" style={{color:"rgba(92,3,49,0.45)",fontFamily:"var(--font-manrope)"}}>De</p>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" value={draftFrom} maxLength={10}
                            onChange={e=>setDraftFrom(maskDate(e.target.value))}
                            className="w-full rounded-[12px] border px-3 h-11 text-[13px] outline-none placeholder:opacity-40"
                            style={{borderColor:calMode==="from"?"var(--wine-800)":"rgba(92,3,49,0.2)",color:"var(--wine-900)",fontFamily:"var(--font-manrope)",background:"white",paddingRight:draftFrom?"2rem":undefined}}/>
                          {draftFrom&&(
                            <button type="button" onClick={()=>{setDraftFrom("");setCalMode(null);}}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full transition-all"
                              style={{color:"rgba(92,3,49,0.45)"}}>
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                        <button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>toggleCal("from")}
                          className="h-11 w-11 rounded-[12px] flex items-center justify-center shrink-0 border transition-all"
                          style={{borderColor:calMode==="from"?"var(--wine-800)":"rgba(92,3,49,0.2)",background:calMode==="from"?"var(--wine-800)":"white"}}>
                          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{color:calMode==="from"?"var(--cream-100)":"rgba(92,3,49,0.4)"}}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </button>
                      </div>
                      <AnimatePresence>
                        {calMode==="from"&&(
                          <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:0.18}}
                            style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:30}}>
                            <MiniCalendar year={calNav.year} month={calNav.month}
                              selectedYMD={brToYMD(draftFrom)} todayYMD={todayStr}
                              onSelect={handleCalSelect}
                              onPrev={()=>setCalNav(p=>{const d=new Date(p.year,p.month-1,1);return{year:d.getFullYear(),month:d.getMonth()};})}
                              onNext={()=>setCalNav(p=>{const d=new Date(p.year,p.month+1,1);return{year:d.getFullYear(),month:d.getMonth()};})}/>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Até */}
                    <div className="relative" ref={calToRef}>
                      <p className="text-[10px] mb-1.5" style={{color:"rgba(92,3,49,0.45)",fontFamily:"var(--font-manrope)"}}>Até</p>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" value={draftTo} maxLength={10}
                            onChange={e=>setDraftTo(maskDate(e.target.value))}
                            className="w-full rounded-[12px] border px-3 h-11 text-[13px] outline-none placeholder:opacity-40"
                            style={{borderColor:calMode==="to"?"var(--wine-800)":"rgba(92,3,49,0.2)",color:"var(--wine-900)",fontFamily:"var(--font-manrope)",background:"white",paddingRight:draftTo?"2rem":undefined}}/>
                          {draftTo&&(
                            <button type="button" onClick={()=>{setDraftTo("");setCalMode(null);}}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full transition-all"
                              style={{color:"rgba(92,3,49,0.45)"}}>
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                        <button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>toggleCal("to")}
                          className="h-11 w-11 rounded-[12px] flex items-center justify-center shrink-0 border transition-all"
                          style={{borderColor:calMode==="to"?"var(--wine-800)":"rgba(92,3,49,0.2)",background:calMode==="to"?"var(--wine-800)":"white"}}>
                          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{color:calMode==="to"?"var(--cream-100)":"rgba(92,3,49,0.4)"}}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </button>
                      </div>
                      <AnimatePresence>
                        {calMode==="to"&&(
                          <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:0.18}}
                            style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:30}}>
                            <MiniCalendar year={calNav.year} month={calNav.month}
                              selectedYMD={brToYMD(draftTo)} todayYMD={todayStr}
                              onSelect={handleCalSelect}
                              onPrev={()=>setCalNav(p=>{const d=new Date(p.year,p.month-1,1);return{year:d.getFullYear(),month:d.getMonth()};})}
                              onNext={()=>setCalNav(p=>{const d=new Date(p.year,p.month+1,1);return{year:d.getFullYear(),month:d.getMonth()};})}/>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed action buttons */}
              <div className="px-6 pb-10 pt-4 flex gap-3 shrink-0" style={{borderTop:"1px solid rgba(92,3,49,0.08)",position:"relative",zIndex:5}}>
                <button type="button" onClick={clearFilters}
                  className="flex-1 h-11 rounded-full text-[12px] font-bold uppercase tracking-wider border active:scale-[0.98] transition-all"
                  style={{borderColor:"rgba(92,3,49,0.2)",color:"var(--wine-800)",fontFamily:"var(--font-manrope)",background:"transparent"}}>
                  Limpar filtro
                </button>
                <button type="button" onClick={applyFilters}
                  className="flex-1 h-11 rounded-full text-[12px] font-bold uppercase tracking-wider active:scale-[0.98] transition-all"
                  style={{background:"var(--wine-800)",color:"var(--cream-100)",fontFamily:"var(--font-manrope)"}}>
                  Aplicar filtro
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Detail drawer ── */}
      <AnimatePresence>
        {selectedItem&&(
          <>
            <motion.div key="detail-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}
              className="absolute inset-0 z-50" style={{background:"rgba(31,16,20,0.5)"}} onClick={()=>setSelectedItem(null)}/>
            <motion.div key="detail-drawer" initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
              transition={{type:"spring",damping:28,stiffness:280}}
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-[28px] px-6 pt-5 pb-10" style={{background:"var(--cream-100)"}}>
              <div className="w-9 h-1 rounded-full mx-auto mb-5" style={{background:"rgba(92,3,49,0.15)"}}/>
              <div className="h-14 w-14 rounded-full flex items-center justify-center mb-3" style={{background:"var(--wine-800)"}}>
                {selectedItem.clientAvatar
                  ?<img src={selectedItem.clientAvatar} alt={selectedItem.clientName} className="h-full w-full rounded-full object-cover"/>
                  :<span className="text-[22px] font-bold" style={{color:"var(--cream-100)",fontFamily:"var(--font-manrope)"}}>{selectedItem.clientName[0]}</span>}
              </div>
              <p className="text-[18px] font-bold" style={{color:"var(--wine-900)",fontFamily:"var(--font-manrope)"}}>{selectedItem.clientName}</p>
              <p className="text-[11px] mt-0.5" style={{color:"var(--ink-500)",fontFamily:"var(--font-manrope)"}}>{formatFullDate(selectedItem.date,selectedItem.time)}</p>
              <div className="flex justify-between items-center mt-5 pt-4 border-t" style={{borderColor:"rgba(92,3,49,0.1)"}}>
                <div>
                  <p className="text-[13px] font-bold" style={{color:"var(--wine-900)",fontFamily:"var(--font-manrope)"}}>{selectedItem.service}</p>
                  <p className="text-[11px] mt-0.5" style={{color:"var(--ink-500)",fontFamily:"var(--font-manrope)"}}>Duração · {selectedItem.duration}</p>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{background:"rgba(78,122,74,0.12)",color:"#4E7A4A",fontFamily:"var(--font-manrope)"}}>Concluído</span>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t" style={{borderColor:"rgba(92,3,49,0.1)"}}>
                <p className="text-[12px]" style={{color:"var(--ink-500)",fontFamily:"var(--font-manrope)"}}>Total recebido</p>
                <p className="text-[22px] font-bold" style={{color:"var(--wine-800)",fontFamily:"var(--font-manrope)"}}>{formatPrice(selectedItem.priceCents)}</p>
              </div>
              {selectedItem.address&&(
                <div className="flex items-start gap-2 mt-4 pt-4 border-t" style={{borderColor:"rgba(92,3,49,0.1)"}}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" style={{color:"rgba(92,3,49,0.4)"}}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  <p className="text-[11px]" style={{color:"rgba(92,3,49,0.55)",fontFamily:"var(--font-manrope)"}}>{selectedItem.address}</p>
                </div>
              )}
              <button type="button" onClick={()=>setSelectedItem(null)}
                className="w-full mt-6 h-11 rounded-full text-[12px] font-bold uppercase tracking-wider active:scale-[0.98] transition-all"
                style={{background:"var(--wine-800)",color:"var(--cream-100)",fontFamily:"var(--font-manrope)"}}>
                Fechar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
