"use client";

import { useRef, useState, useEffect } from "react";
import { useUser, useClerk, useAuth } from "@clerk/nextjs";
import { useSupabase, SUPABASE_BUCKET, avatarPath } from "@/lib/supabase";
import { IconCamera, IconPhone, IconUser, IconCalendar, IconPin, IconMail, IconArrowRight, IconHome } from "../onboarding/icons";
import { motion, AnimatePresence } from "framer-motion";

// Helper function to format phone numbers
function formatPhone(digits: string): string {
  if (!digits) return "";
  const cleaned = digits.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned;
}

// Extra Custom SVG Icons for Premium Interface
const IconHeart = ({ size = 20, fill = "none", className = "" }: { size?: number; fill?: string; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const IconStar = ({ size = 14, fill = "currentColor", className = "" }: { size?: number; fill?: string; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconTrash = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
  </svg>
);

const IconEdit = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const IconPlus = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14M12 5v14" />
  </svg>
);

const IconBookmark = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

interface Address {
  id: string;
  user_id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

interface Favorite {
  id: string;
  client_id: string;
  professional_id: string;
  professional_profile: {
    id: string;
    bio: string;
    base_city: string;
    user: {
      id: string;
      full_name: string;
      avatar_url: string;
    };
  };
}

interface Booking {
  id: string;
  client_id: string;
  professional_id: string | null;
  status: string;
  mode: string;
  scheduled_at: string | null;
  total_cents: number;
  payment_method: string;
  address_snapshot: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    label?: string;
  };
  created_at: string;
  service_name?: string;
  professional_profile?: {
    user: {
      full_name: string;
      avatar_url: string;
    };
  } | null;
}

// Interactive Mocks for Favoriting
const MOCK_PROFESSIONALS = [
  {
    id: "mock-prof-1",
    name: "Mariana Silva",
    specialty: "Pedicure",
    rating: 4.9,
    reviewsCount: 42,
    seals: 3,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
    coverUrl: "https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?auto=format&fit=crop&q=80&w=800",
    city: "São Paulo",
    bio: "Especialista em pedicure com mais de 5 anos de experiência. Apaixonada por transformar os pés das clientes com todo o cuidado e higiene que você merece. Atendo em domicílio com equipamentos esterilizados.",
    services: ["Pedicure"],
    certifications: [
      { name: "Técnica em Nail Art Avançada", issuer: "Instituto de Beleza Paulista", date: "Mar 2023", description: "Curso avançado focado em nail art com técnicas de pintura livre, carimbos e decorações 3D. Aprendi a trabalhar com diferentes tipos de gel e materiais para criar designs únicos para cada cliente." },
      { name: "Especialização em Pedicure em Gel", issuer: "Beauty Academy SP", date: "Jul 2022", description: "Especialização completa em pedicure com gel de alta durabilidade. Técnicas de preparação, modelagem e finalização para garantir um resultado impecável que dura até 6 semanas." },
    ],
    reviews: [
      { id: "r1", clientName: "Ana Paula", clientPhoto: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=80", rating: 5, title: "Profissional incrível!", date: "10 de junho de 2026", specialty: "Pedicure", comment: "Atendimento impecável, super caprichosa e pontual. Já indiquei para todas as minhas amigas!" },
      { id: "r2", clientName: "Fernanda G.", clientPhoto: "", rating: 4, title: "Muito boa, recomendo", date: "2 de maio de 2026", specialty: "Pedicure", comment: "Resultado ficou ótimo e ela usa materiais de qualidade. Só acho que poderia ter um pouquinho mais de opções de esmalte." },
      { id: "r3", clientName: "Juliana T.", clientPhoto: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=80", rating: 5, title: "Melhor pedicure da cidade!", date: "15 de abril de 2026", specialty: "Pedicure", comment: "Fiz pedicure em gel com ela e ficou absolutamente lindo. Durou muito mais do que eu esperava. Com certeza voltarei!" },
      { id: "r4", clientName: "Bruna C.", clientPhoto: "", rating: 5, title: "Superou minhas expectativas!", date: "30 de março de 2026", specialty: "Pedicure", comment: "Nunca tinha feito pedicure em domicílio e agora não quero mais sair de casa pra isso. Ela traz tudo organizado e o resultado é perfeito." },
      { id: "r5", clientName: "Tatiane R.", clientPhoto: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=80", rating: 4, title: "Ótima profissional", date: "14 de março de 2026", specialty: "Pedicure", comment: "Muito caprichosa e atenciosa. O esmalte durou mais de 3 semanas. Voltarei com certeza!" },
      { id: "r6", clientName: "Monique A.", clientPhoto: "", rating: 5, title: "Adorei, 10 estrelas!", date: "28 de fevereiro de 2026", specialty: "Pedicure", comment: "Além de um trabalho lindo, ela é super simpática e o atendimento foi rápido. Minha pedicure favorita daqui pra frente." },
      { id: "r7", clientName: "Débora S.", clientPhoto: "", rating: 3, title: "Boa, mas atrasou um pouco", date: "10 de fevereiro de 2026", specialty: "Pedicure", comment: "O trabalho ficou bonito, mas ela chegou uns 20 minutos atrasada sem avisar antes. O resultado compensou, mas prefiro ser avisada." },
    ],
  },
  {
    id: "mock-prof-2",
    name: "Beatriz Santos",
    specialty: "Designer de sobrancelha",
    rating: 5.0,
    reviewsCount: 28,
    seals: 5,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    coverUrl: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&q=80&w=800",
    city: "Campinas",
    bio: "Especialista em design de sobrancelhas com técnica personalizada para cada rosto. Cada sobrancelha é única e merece um mapeamento exclusivo. Atendo em domicílio com materiais de alta qualidade.",
    services: ["Designer de sobrancelha", "Micropigmentadora"],
    certifications: [
      { name: "Designer de Sobrancelhas Avançada", issuer: "Faculdade Anhanguera", date: "Dez 2020", description: "Formação completa em design e mapeamento de sobrancelhas com base na análise do rosto de cada cliente. Técnicas de henna, laminação e brow lifting para realçar a beleza natural." },
      { name: "Micropigmentação de Sobrancelhas", issuer: "Academia Brow Expert", date: "Fev 2022", description: "Certificação em micropigmentação pelo método fio a fio e sombreado. Trabalho com pigmentos dermais de alta fixação para resultados naturais e duradouros de até 2 anos." },
    ],
    reviews: [
      { id: "r1", clientName: "Larissa M.", clientPhoto: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=80", rating: 5, title: "Sobrancelha dos sonhos!", date: "18 de junho de 2026", specialty: "Designer de sobrancelha", comment: "Mapeou meu rosto com cuidado e o resultado foi surreal. Parece que nasci com essa sobrancelha!" },
      { id: "r2", clientName: "Carla B.", clientPhoto: "", rating: 5, title: "Perfeita! Voltarei sempre", date: "5 de maio de 2026", specialty: "Designer de sobrancelha", comment: "Já fui em várias profissionais e Beatriz é disparada a melhor. Técnica impecável e muito cuidadosa." },
      { id: "r3", clientName: "Viviane P.", clientPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80", rating: 5, title: "Transformação incrível!", date: "22 de abril de 2026", specialty: "Micropigmentadora", comment: "Fiz micropigmentação e acordei todo dia amando minhas sobrancelhas. Trabalho preciso, resultado natural e duradouro." },
      { id: "r4", clientName: "Isabela F.", clientPhoto: "", rating: 4, title: "Muito satisfeita", date: "8 de abril de 2026", specialty: "Designer de sobrancelha", comment: "Ótimo mapeamento, ela explicou tudo antes de começar. Fiquei feliz com o resultado, só precisei de um pequeno ajuste depois." },
      { id: "r5", clientName: "Nádia C.", clientPhoto: "", rating: 5, title: "Recomendo de olhos fechados!", date: "15 de março de 2026", specialty: "Designer de sobrancelha", comment: "Tinha medo de designer de sobrancelha mas ela me deixou super tranquila. Resultado equilibrado e natural, exatamente o que eu queria." },
    ],
  },
  {
    id: "mock-prof-3",
    name: "Camila Oliveira",
    specialty: "Massoterapeuta",
    rating: 4.8,
    reviewsCount: 19,
    seals: 1,
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300",
    coverUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800",
    city: "São Bernardo",
    bio: "Massoterapeuta certificada com foco em bem-estar e relaxamento. Realizo massagens terapêuticas, relaxantes e drenagem linfática manual. Meu objetivo é proporcionar equilíbrio entre corpo e mente no conforto da sua casa.",
    services: ["Massoterapeuta"],
    certifications: [
      { name: "Massoterapeuta Clínica", issuer: "Escola de Massoterapia do Brasil", date: "Jun 2021", description: "Formação completa em massoterapia clínica com foco em alívio de tensões musculares, dores crônicas e bem-estar geral. Técnicas suecas, relaxantes e terapêuticas aplicadas no domicílio do cliente." },
      { name: "Drenagem Linfática Manual – Método Vodder", issuer: "Instituto Terapêutico ABC", date: "Nov 2022", description: "Certificação no método Vodder de drenagem linfática manual, reconhecido internacionalmente. Indicado para redução de inchaços, pós-operatório e melhora da circulação. Resultados visíveis já na primeira sessão." },
    ],
    reviews: [
      { id: "r1", clientName: "Renata F.", clientPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80", rating: 5, title: "Relaxamento total!", date: "20 de junho de 2026", specialty: "Massoterapeuta", comment: "A massagem foi maravilhosa! Saí completamente renovada. Ela tem um toque muito leve e preciso, recomendo demais." },
      { id: "r2", clientName: "Patrícia S.", clientPhoto: "", rating: 4, title: "Ótima profissional", date: "8 de junho de 2026", specialty: "Massoterapeuta", comment: "Drenagem linfática excelente, já senti resultado logo na primeira sessão. Agendei mais 4 sessões na hora!" },
      { id: "r3", clientName: "Gisele M.", clientPhoto: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=80", rating: 5, title: "Minha terapeuta favorita!", date: "1 de junho de 2026", specialty: "Massoterapeuta", comment: "Faço sessões semanais com a Camila há 2 meses e a diferença no meu corpo é impressionante. Ela é muito atenciosa e personaliza cada sessão." },
      { id: "r4", clientName: "Cintia L.", clientPhoto: "", rating: 5, title: "Cura de verdade", date: "18 de maio de 2026", specialty: "Massoterapeuta", comment: "Tinha muita tensão nas costas por conta do trabalho remoto. Depois de 3 sessões com ela, as dores sumiram. Recomendo muito!" },
      { id: "r5", clientName: "Aline T.", clientPhoto: "", rating: 4, title: "Muito bem, voltarei", date: "5 de maio de 2026", specialty: "Massoterapeuta", comment: "Massagem relaxante muito boa. Ela chegou no horário combinado e foi super profissional. Só queria que a sessão durasse mais!" },
      { id: "r6", clientName: "Roberta V.", clientPhoto: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=80", rating: 5, title: "Melhor investimento!", date: "20 de abril de 2026", specialty: "Massoterapeuta", comment: "Presentes de aniversário que me dei foi essa massagem. Completamente apaixonada, já agendei o próximo mês inteiro." },
    ],
  },
];

// Interactive Mocks for Bookings
const MOCK_BOOKINGS: Booking[] = [
  {
    id: "mock-booking-1",
    client_id: "me",
    professional_id: "mock-prof-1",
    status: "pending",
    mode: "scheduled",
    scheduled_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    total_cents: 9000,
    payment_method: "pix",
    address_snapshot: { street: "Av. Paulista", number: "1000", complement: "Apto 42", label: "Casa", city: "São Paulo", state: "SP" },
    created_at: new Date().toISOString(),
    service_name: "Pedicure Completa",
    professional_profile: {
      user: {
        full_name: "Mariana Silva",
        avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
      },
    },
  },
  {
    id: "mock-booking-2",
    client_id: "me",
    professional_id: "mock-prof-2",
    status: "pending",
    mode: "scheduled",
    scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    total_cents: 6500,
    payment_method: "pix",
    address_snapshot: { street: "Rua Oscar Freire", number: "450", complement: "Casa", label: "Trabalho", city: "São Paulo", state: "SP" },
    created_at: new Date().toISOString(),
    service_name: "Pedicure em Gel",
    professional_profile: {
      user: {
        full_name: "Camila Torres",
        avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=120",
      },
    },
  },
  {
    id: "mock-booking-3",
    client_id: "me",
    professional_id: "mock-prof-3",
    status: "accepted",
    mode: "scheduled",
    scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    total_cents: 12000,
    payment_method: "pix",
    address_snapshot: { street: "Av. Paulista", number: "1000", complement: "Apto 42", label: "Casa", city: "São Paulo", state: "SP" },
    created_at: new Date().toISOString(),
    service_name: "Design de Sobrancelhas",
    professional_profile: {
      user: {
        full_name: "Beatriz Santos",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
      },
    },
  },
  {
    id: "mock-booking-4",
    client_id: "me",
    professional_id: "mock-prof-4",
    status: "completed",
    mode: "scheduled",
    scheduled_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    total_cents: 8500,
    payment_method: "pix",
    address_snapshot: { street: "Rua Haddock Lobo", number: "200", label: "Casa", city: "São Paulo", state: "SP" },
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    service_name: "Limpeza de Pele Profunda",
    professional_profile: {
      user: {
        full_name: "Renata Oliveira",
        avatar_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=120",
      },
    },
  },
  {
    id: "mock-booking-5",
    client_id: "me",
    professional_id: "mock-prof-5",
    status: "cancelled",
    mode: "scheduled",
    scheduled_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    total_cents: 5500,
    payment_method: "pix",
    address_snapshot: { street: "Av. Brigadeiro Faria Lima", number: "3900", label: "Trabalho", city: "São Paulo", state: "SP" },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    service_name: "Pedicure Completa",
    professional_profile: {
      user: {
        full_name: "Juliana Barros",
        avatar_url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=120",
      },
    },
  },
];

type ActiveTab = "mapa" | "perfil" | "enderecos" | "favoritos" | "agendamentos";

export function ClientProfile() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const clerk = useClerk();
  const supabase = useSupabase();

  const [activeTab, setActiveTab] = useState<ActiveTab>("perfil");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Database loading state
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [loadingDb, setLoadingDb] = useState(true);

  // Client data states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [mockStatuses, setMockStatuses] = useState<Record<string, string>>({});

  // Tracks whether we've already attempted to seed the onboarding address
  // into public.addresses, to avoid loops/retries on transient state.
  const seedAttemptedRef = useRef(false);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Custom Toast State
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "add" | "edit" | "delete" | "default" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "add",
  });

  const showToast = (message: string, type: "add" | "edit" | "delete" | "default" | "error" = "add") => {
    setToast({
      isOpen: true,
      message,
      type,
    });
  };

  useEffect(() => {
    if (toast.isOpen) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, isOpen: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.isOpen]);

  // Address Form States
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formCep, setFormCep] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formComplement, setFormComplement] = useState("");
  const [formNeighborhood, setFormNeighborhood] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Interactive Mock Favorites (represented as active mock IDs)
  const [localMockFavorites, setLocalMockFavorites] = useState<string[]>(["mock-prof-1", "mock-prof-3"]);
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(3);

  // 1) Fetch database user id from public.users mapping.
  // Tenta SELECT direto pelo clerk_user_id; se não achar (ex: usuário trocou de
  // provedor de auth e o Clerk emitiu um sub novo, mas já existe linha com o
  // mesmo email), faz fallback no server route /api/users/claim que usa
  // service_role pra reconciliar — o front-end não consegue UPDATE/INSERT em
  // users por causa da RLS.
  useEffect(() => {
    if (!isLoaded || !user) return;
    const clerkUserId = user.id;
    async function loadUser() {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", clerkUserId)
          .maybeSingle();
        if (error) {
          console.error("Failed to load user from db:", error);
          return;
        }

        if (data) {
          setDbUserId(data.id);
          return;
        }

        const token = await getToken();
        const res = await fetch("/api/users/claim", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          console.error("Failed to claim user via server route:", await res.text());
          return;
        }
        const body = (await res.json()) as { id?: string; reconciled?: boolean };
        if (body.id) {
          if (body.reconciled) {
            console.info("[users/claim] reconciled existing row by email");
          }
          setDbUserId(body.id);
        }
      } finally {
        setLoadingDb(false);
      }
    }
    loadUser();
  }, [user, supabase]);

  // 2) Load addresses, favorites, and bookings from Supabase
  async function refreshData() {
    if (!dbUserId) return;
    setLoadingData(true);
    try {
      // Fetch addresses
      const { data: addrData, error: addrError } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", dbUserId)
        .order("is_default", { ascending: false });
      if (addrError) throw addrError;
      if (addrData) setAddresses(addrData);

      // Fetch favorites
      const { data: favsData, error: favsError } = await supabase
        .from("favorites")
        .select(`
          id,
          client_id,
          professional_id,
          professional_profile:professional_profiles (
            id,
            bio,
            base_city,
            user:users (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq("client_id", dbUserId);
      if (favsError) throw favsError;
      if (favsData) setFavorites(favsData as unknown as Favorite[]);

      // Fetch bookings
      const { data: bksData, error: bksError } = await supabase
        .from("bookings")
        .select(`
          id,
          client_id,
          professional_id,
          status,
          mode,
          scheduled_at,
          total_cents,
          payment_method,
          address_snapshot,
          created_at,
          professional_profile:professional_profiles (
            id,
            user:users (
              full_name,
              avatar_url
            )
          )
        `)
        .eq("client_id", dbUserId)
        .order("created_at", { ascending: false });
      if (bksError) throw bksError;
      if (bksData) setBookings(bksData as unknown as Booking[]);
    } catch (err) {
      console.error("Failed to fetch client profile data:", err);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (dbUserId) {
      refreshData();
    }
  }, [dbUserId]);

  // Seed the onboarding address into public.addresses on first load.
  // The Profile tab reads from Clerk metadata while the Addresses tab reads
  // from Supabase, so without this the user would see their cadastro address
  // on one tab and an empty list on the other.
  useEffect(() => {
    if (!user) return;
    if (!dbUserId) return;
    if (loadingData) return;
    if (addresses.length > 0) return;
    if (seedAttemptedRef.current) return;

    const meta = user.unsafeMetadata || {};
    const cepMeta = (meta.cep as string) ?? "";
    const enderecoMeta = (meta.endereco as string) ?? "";
    const numeroMeta = (meta.numero as string) ?? "";
    const complementoMeta = (meta.complemento as string) ?? "";

    const cepDigits = cepMeta.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      console.warn("[addresses seed] skipped: invalid/missing CEP in metadata", {
        cep: cepMeta,
        digitsLength: cepDigits.length,
      });
      return;
    }
    if (!enderecoMeta.trim() || !numeroMeta.trim()) {
      console.warn("[addresses seed] skipped: missing endereco/numero in metadata", {
        endereco: enderecoMeta,
        numero: numeroMeta,
      });
      return;
    }

    seedAttemptedRef.current = true;

    (async () => {
      // Onboarding stores endereco joined as "Rua · Bairro · Cidade/UF"
      // (see OnboardingWizard + StepEndereco ViaCEP autofill).
      const parts = enderecoMeta.split(" · ").map((p) => p.trim()).filter(Boolean);
      let street = parts[0] ?? "";
      let neighborhood: string | null = parts[1] ?? null;
      let city = "";
      let state = "";
      if (parts[2]) {
        const [c, s] = parts[2].split("/").map((p) => p.trim());
        city = c ?? "";
        state = s ?? "";
      }

      // If the user typed the endereco freeform (no autofill), fall back to ViaCEP.
      if (!city || !state || !street) {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
          const data = await res.json();
          if (!data.erro) {
            if (!street) street = data.logradouro ?? enderecoMeta;
            if (!neighborhood) neighborhood = data.bairro ?? null;
            if (!city) city = data.localidade ?? "";
            if (!state) state = data.uf ?? "";
          }
        } catch (err) {
          console.error("[addresses seed] ViaCEP lookup failed:", err);
        }
      }

      if (!street || !city || !state) {
        console.warn("[addresses seed] skipped: could not resolve street/city/state", {
          street,
          city,
          state,
          parsedFromMeta: parts,
        });
        seedAttemptedRef.current = false; // allow retry on next render
        return;
      }

      const payload = {
        user_id: dbUserId,
        label: "Casa",
        street,
        number: numeroMeta,
        complement: complementoMeta.trim() || null,
        neighborhood,
        city,
        state,
        postal_code: cepDigits,
        is_default: true,
      };
      console.info("[addresses seed] inserting default from onboarding metadata", payload);

      const { error } = await supabase.from("addresses").insert(payload);
      if (error) {
        // 23505 = unique_violation. Em dev o Fast Refresh do Turbopack
        // remonta o componente, o useRef é resetado e o seed roda de novo;
        // como o índice addresses_one_default_per_user_uq garante um padrão
        // por usuário, o segundo INSERT bate. Tratamos como sucesso e só
        // sincronizamos a lista.
        if ((error as { code?: string }).code === "23505") {
          console.info("[addresses seed] address already exists — refreshing list");
          refreshData();
          return;
        }
        console.error("[addresses seed] insert failed:", error);
        seedAttemptedRef.current = false; // allow retry after user fixes the issue
        return;
      }
      console.info("[addresses seed] inserted successfully — refreshing list");
      refreshData();
    })();
  }, [user, dbUserId, loadingData, addresses.length, supabase]);

  // Set Address Form field values when editingAddress changes
  useEffect(() => {
    if (editingAddress) {
      setFormLabel(editingAddress.label);
      setFormCep(editingAddress.postal_code);
      setFormStreet(editingAddress.street);
      setFormNumber(editingAddress.number);
      setFormComplement(editingAddress.complement ?? "");
      setFormNeighborhood(editingAddress.neighborhood ?? "");
      setFormCity(editingAddress.city);
      setFormState(editingAddress.state);
      setFormIsDefault(editingAddress.is_default);
    } else {
      setFormLabel("");
      setFormCep("");
      setFormStreet("");
      setFormNumber("");
      setFormComplement("");
      setFormNeighborhood("");
      setFormCity("");
      setFormState("");
      setFormIsDefault(false);
    }
  }, [editingAddress]);

  if (!user) return null;

  const metadata = user.unsafeMetadata || {};
  const phone = formatPhone((metadata.phone as string) ?? "");
  const nascimento = (metadata.nascimento as string) ?? "";
  const cep = (metadata.cep as string) ?? "";
  const endereco = (metadata.endereco as string) ?? "";
  const numero = (metadata.numero as string) ?? "";
  const complemento = (metadata.complemento as string) ?? "";

  // Upload/Change avatar photo
  const handlePhotoClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const raw = e.target.files?.[0];
    if (!raw) return;

    // Converte via canvas para garantir JPEG válido — o Clerk rejeita
    // arquivos cujo Content-Type seja application/octet-stream.
    const file = await new Promise<File>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(raw);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("canvas conversion failed"));
            const name = raw.name.replace(/\.[^.]+$/, "") + ".jpg";
            resolve(new File([blob], name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.92,
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
      img.src = url;
    });

    setUploading(true);
    try {
      const path = avatarPath(user.id, file);
      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(path, file, {
          upsert: true,
          cacheControl: "3600",
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      await user.setProfileImage({ file });
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          avatarPath: path,
        },
      });
    } catch (err) {
      console.error("Failed to update profile image:", err);
    } finally {
      setUploading(false);
    }
  };

  // Sign out
  async function handleSignOut() {
    await clerk.signOut();
  }

  // Refactor/Reset Onboarding for testing
  const handleResetOnboarding = () => {
    if (!user) return;
    triggerConfirm(
      "Refazer Onboarding",
      "Deseja refazer o onboarding? Isso redefinirá seu cadastro.",
      async () => {
        try {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              onboardingComplete: false,
            },
          });
          window.location.reload();
        } catch (err) {
          console.error("Error resetting onboarding:", err);
        }
      }
    );
  };

  // Switch Role type to Professional for testing
  const handleSwitchToProfessional = async () => {
    if (!user) return;
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          tipo: "profissional",
        },
      });
      window.location.reload();
    } catch (err) {
      console.error("Error switching type:", err);
    }
  };

  // Fetch ViaCEP info
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5, 8)}`;
    }
    setFormCep(formatted);

    if (raw.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormStreet(data.logradouro ?? "");
          setFormNeighborhood(data.bairro ?? "");
          setFormCity(data.localidade ?? "");
          setFormState(data.uf ?? "");
        }
      } catch (err) {
        console.error("ViaCEP lookup failed:", err);
      }
    }
  };

  // Sync default address to Clerk unsafeMetadata so Profile tab reflects it
  const syncDefaultToClerk = async (addr: { street: string; number: string; complement?: string | null; neighborhood?: string | null; city: string; state: string; postal_code: string }) => {
    if (!user) return;
    const fullEndereco = [addr.street, addr.neighborhood, `${addr.city}/${addr.state}`]
      .filter(Boolean)
      .join(" \u00b7 ");
    await user.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        endereco: fullEndereco,
        numero: addr.number,
        complemento: addr.complement ?? "",
        cep: addr.postal_code,
      },
    });
  };

  // Address CRUD Actions
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUserId) return;
    if (!formLabel || !formStreet || !formNumber || !formCity || !formState) return;

    setSavingAddress(true);
    try {
      const isDefault = formIsDefault || addresses.length === 0;

      if (isDefault) {
        // Set all other user addresses to is_default = false
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", dbUserId);
      }

      const payload = {
        user_id: dbUserId,
        label: formLabel,
        street: formStreet,
        number: formNumber,
        complement: formComplement.trim() || null,
        neighborhood: formNeighborhood.trim() || null,
        city: formCity,
        state: formState,
        postal_code: formCep.replace(/\D/g, ""),
        is_default: isDefault,
      };

      if (editingAddress) {
        const { error } = await supabase
          .from("addresses")
          .update(payload)
          .eq("id", editingAddress.id);
        if (error) throw error;
        showToast("Endereço atualizado com sucesso!", "edit");
      } else {
        const { error } = await supabase
          .from("addresses")
          .insert(payload);
        if (error) throw error;
        showToast("Endereço cadastrado com sucesso!", "add");
      }

      // If this address is the new default, sync to Clerk Profile tab
      if (isDefault) {
        await syncDefaultToClerk(payload);
      }

      setShowAddressForm(false);
      setEditingAddress(null);
      refreshData();
    } catch (err) {
      console.error("Error saving address:", err);
      showToast("Falha ao salvar endereço. Tente novamente.", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = (id: string, isDefault: boolean) => {
    triggerConfirm(
      "Excluir Endereço",
      "Tem certeza que deseja excluir este endereço? Esta ação não poderá ser desfeita.",
      async () => {
        try {
          const { error } = await supabase
            .from("addresses")
            .delete()
            .eq("id", id);
          if (error) throw error;

          if (isDefault && addresses.length > 1) {
            const nextDefault = addresses.find((a) => a.id !== id);
            if (nextDefault) {
              await supabase
                .from("addresses")
                .update({ is_default: true })
                .eq("id", nextDefault.id);
              // Sync the promoted default to Clerk Profile tab
              await syncDefaultToClerk(nextDefault);
            }
          }
          showToast("Endereço excluído com sucesso!", "delete");
          refreshData();
        } catch (err) {
          console.error("Error deleting address:", err);
          showToast("Erro ao excluir endereço.", "error");
        }
      }
    );
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!dbUserId) return;
    try {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", dbUserId);

      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;

      // Sync the new default address to Clerk Profile tab
      const addr = addresses.find((a) => a.id === id);
      if (addr) {
        await syncDefaultToClerk(addr);
      }

      showToast("Endereço padrão atualizado!", "default");
      refreshData();
    } catch (err) {
      console.error("Error updating default address:", err);
      showToast("Erro ao definir endereço padrão.", "error");
    }
  };

  // Confirm booking (pending → accepted)
  const handleConfirmBooking = async (bookingId: string) => {
    if (bookingId.startsWith("mock-")) {
      setMockStatuses((prev) => ({ ...prev, [bookingId]: "accepted" }));
      showToast("Atendimento confirmado!", "add");
      return;
    }
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", bookingId);
      if (error) throw error;
      showToast("Atendimento confirmado!", "add");
      refreshData();
    } catch (err) {
      console.error("Error confirming booking:", err);
      showToast("Erro ao confirmar atendimento.", "error");
    }
  };

  // Cancel booking (pending/accepted → cancelled)
  const handleCancelBooking = (bookingId: string) => {
    triggerConfirm(
      "Cancelar Atendimento",
      "Tem certeza que deseja cancelar este atendimento?",
      async () => {
        if (bookingId.startsWith("mock-")) {
          setMockStatuses((prev) => ({ ...prev, [bookingId]: "cancelled" }));
          showToast("Atendimento cancelado.", "delete");
          return;
        }
        try {
          const { error } = await supabase
            .from("bookings")
            .update({
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
              cancelled_by: dbUserId,
            })
            .eq("id", bookingId);
          if (error) throw error;
          showToast("Atendimento cancelado.", "delete");
          refreshData();
        } catch (err) {
          console.error("Error cancelling booking:", err);
          showToast("Erro ao cancelar atendimento.", "error");
        }
      }
    );
  };

  // Toggle Favorite
  const handleToggleFavoriteReal = async (professionalProfileId: string, currentFavId?: string) => {
    if (!dbUserId) return;
    try {
      if (currentFavId) {
        await supabase
          .from("favorites")
          .delete()
          .eq("id", currentFavId);
      } else {
        await supabase
          .from("favorites")
          .insert({
            client_id: dbUserId,
            professional_id: professionalProfileId,
          });
      }
      refreshData();
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const handleToggleMockFavorite = (id: string) => {
    setLocalMockFavorites((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pendente", color: "text-amber-700 bg-amber-100 border-amber-200" };
      case "accepted":
      case "on_the_way":
      case "arrived":
      case "started":
      case "in_progress":
        return { label: "Confirmado", color: "text-pink-700 bg-pink-100 border-pink-200" };
      case "completed":
        return { label: "Concluído", color: "text-emerald-700 bg-emerald-100 border-emerald-200" };
      case "cancelled":
      case "rejected":
      case "expired":
        return { label: "Cancelado", color: "text-red-700 bg-red-100 border-red-200" };
      default:
        return { label: status, color: "text-[var(--ink-500)] bg-black/5 border-[rgba(92,3,49,0.1)]" };
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      ` }} />

      {/* Profile Header */}
      {(() => {
        const headerMap: Record<ActiveTab, { title: string; subtitle: string }> = {
          mapa:         { title: "Explorar",    subtitle: "Perto de Você"          },
          perfil:       { title: "Meu Perfil",  subtitle: "Área da Cliente"        },
          enderecos:    { title: "Endereços",   subtitle: "Meus Locais"            },
          favoritos:    { title: "Favoritas",   subtitle: "Profissionais Salvas"   },
          agendamentos: { title: "Agenda",      subtitle: "Histórico de Serviços"  },
        };
        const { title, subtitle } = headerMap[activeTab];
        return (
          <header className="text-center shrink-0 px-5 pt-6 pb-4" style={{ background: "var(--wine-800)" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <h1
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: "32px",
                    lineHeight: 1.1,
                    color: "var(--cream-100)",
                  }}
                >
                  {title}
                </h1>
                <p
                  className="mt-1.5 text-[10px] uppercase tracking-[0.16em]"
                  style={{
                    fontFamily: "var(--font-manrope)",
                    color: "rgba(245, 239, 230, 0.5)",
                  }}
                >
                  {subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </header>
        );
      })()}

      {/* Content views with transitions — nude background */}
      <div className="bg-warm-gradient flex-1 overflow-y-auto no-scrollbar w-full px-5 pt-6" style={{ paddingBottom: "100px" }}>
        <div className="flex flex-col w-full max-w-[390px] mx-auto flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "perfil" && (
            <motion.div
              key="perfil-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5 w-full"
            >
              {/* Avatar block */}
              <div className="flex flex-col items-center py-2">
                <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                  <div className="h-24 w-24 overflow-hidden rounded-full border border-[rgba(92,3,49,0.15)] group-hover:border-[var(--wine-800)] transition-all shadow-[0_8px_32px_-12px_rgba(92,3,49,0.3)] flex items-center justify-center bg-white/60">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.fullName ?? "Avatar"}
                        className={`h-full w-full object-cover transition-opacity duration-300 ${uploading ? "opacity-30" : "opacity-100"}`}
                      />
                    ) : (
                      <span className="text-2xl font-bold uppercase text-[var(--wine-800)]">
                        {user.firstName?.[0] ?? "C"}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <IconCamera size={22} className="text-[var(--cream-100)]" />
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--wine-800)] border-t-transparent" />
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handlePhotoClick}
                  disabled={uploading}
                  className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[var(--wine-800)] hover:text-[var(--wine-900)] transition-colors disabled:opacity-50"
                  style={{ fontFamily: "var(--font-manrope)" }}
                >
                  {uploading ? "Salvando..." : "Alterar foto de perfil"}
                </button>
              </div>

              {/* Personal Info Card */}
              <div className="flex flex-col gap-4.5 rounded-[22px] p-5 border border-[rgba(92,3,49,0.08)] bg-white/60 shadow-[0_8px_32px_-12px_rgba(92,3,49,0.15)]">
                <h2 className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--wine-800)] mb-0.5">
                  Informações Pessoais
                </h2>

                <div className="flex items-center gap-3.5">
                  <span className="text-[var(--wine-800)] shrink-0 opacity-80"><IconUser size={18} /></span>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.5)]">Nome Completo</span>
                    <span className="text-[13px] text-[var(--wine-900)] font-medium mt-0.5">{user.fullName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <span className="text-[var(--wine-800)] shrink-0 opacity-80"><IconMail size={18} /></span>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.5)]">E-mail</span>
                    <span className="text-[13px] text-[var(--wine-900)] font-medium truncate max-w-[250px] mt-0.5">{user.primaryEmailAddress?.emailAddress}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <span className="text-[var(--wine-800)] shrink-0 opacity-80"><IconPhone size={18} /></span>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.5)]">Celular</span>
                    <span className="text-[13px] text-[var(--wine-900)] font-medium mt-0.5">{phone || "Não informado"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <span className="text-[var(--wine-800)] shrink-0 opacity-80"><IconCalendar size={18} /></span>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.5)]">Nascimento</span>
                    <span className="text-[13px] text-[var(--wine-900)] font-medium mt-0.5">{nascimento || "Não informado"}</span>
                  </div>
                </div>
              </div>

              {/* Onboarding Address Card */}
              <div className="flex flex-col gap-4 rounded-[22px] p-5 border border-[rgba(92,3,49,0.08)] bg-white/60 shadow-[0_8px_32px_-12px_rgba(92,3,49,0.15)]">
                <h2 className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--wine-800)] mb-0.5">
                  Endereço de Cadastro
                </h2>
                <div className="flex items-start gap-3.5">
                  <span className="text-[var(--wine-800)] mt-0.5 shrink-0 opacity-80"><IconPin size={18} /></span>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col">
                      <span className="text-[13px] text-[var(--wine-900)] font-medium leading-relaxed">
                        {endereco || "Não cadastrado"}
                        {numero && `, nº ${numero}`}
                      </span>
                      {complemento && (
                        <span className="text-[12px] text-[var(--ink-500)] mt-0.5">{complemento}</span>
                      )}
                    </div>
                    {cep && (
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.5)]">CEP</span>
                        <span className="text-[13px] text-[var(--wine-900)] font-medium">{formatPhone(cep)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("enderecos");
                    setShowAddressForm(false);
                    setEditingAddress(null);
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 h-9 w-full rounded-xl border border-[rgba(92,3,49,0.15)] text-[10px] font-bold uppercase tracking-wider text-[var(--wine-800)] hover:bg-[rgba(92,3,49,0.05)] hover:text-[var(--wine-900)] transition-all active:scale-[0.98] cursor-pointer"
                  style={{ fontFamily: "var(--font-manrope)" }}
                >
                  <span>Gerenciar Endereços</span>
                  <IconArrowRight size={12} />
                </button>
              </div>

              {/* Dev settings */}
              <div className="flex flex-col gap-3 rounded-[22px] p-4.5 border border-[rgba(92,3,49,0.06)] bg-white/30 mt-2">
                <span className="text-[8px] font-bold uppercase tracking-widest text-[rgba(92,3,49,0.4)]">Ambiente de Testes (Dev)</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetOnboarding}
                    className="flex-1 h-9 rounded-xl border border-[rgba(92,3,49,0.15)] text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] hover:bg-[rgba(92,3,49,0.05)] hover:text-[var(--wine-800)] transition-colors"
                  >
                    Refazer Onboarding
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchToProfessional}
                    className="flex-1 h-9 rounded-xl border border-[rgba(92,3,49,0.15)] text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] hover:bg-[rgba(92,3,49,0.05)] hover:text-[var(--wine-800)] transition-colors"
                  >
                    Mudar p/ Profissional
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-4 flex h-11 w-full items-center justify-center rounded-full text-[11px] font-bold uppercase tracking-[0.16em] transition-all bg-[var(--wine-800)] text-[var(--cream-100)] hover:opacity-90 active:scale-[0.99] shadow-[0_8px_24px_-12px_rgba(92,3,49,0.5)]"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                Sair da Conta
              </button>
            </motion.div>
          )}

          {activeTab === "enderecos" && (
            <motion.div
              key="enderecos-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 w-full"
            >
              {/* Form Toggle button (if not editing or adding) */}
              {!showAddressForm && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddress(null);
                    setShowAddressForm(true);
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[rgba(92,3,49,0.25)] hover:border-[var(--wine-800)] text-[11px] font-bold uppercase tracking-wider text-[var(--wine-800)] hover:text-[var(--wine-900)] hover:bg-white/30 transition-all active:scale-[0.99] mb-2"
                >
                  <IconPlus size={14} />
                  Adicionar Endereço
                </button>
              )}

              {/* Address Form */}
              {showAddressForm && (
                <motion.form
                  onSubmit={handleSaveAddress}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex flex-col gap-3.5 rounded-[22px] p-5 border border-[rgba(92,3,49,0.1)] bg-white/70 shadow-[0_8px_32px_-12px_rgba(92,3,49,0.2)] mb-3 overflow-hidden"
                >
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--wine-800)] mb-1">
                    {editingAddress ? "Editar Endereço" : "Novo Endereço"}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Label/Apelido */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.55)]">Apelido (ex: Casa)</label>
                      <input
                        type="text"
                        required
                        value={formLabel}
                        onChange={(e) => setFormLabel(e.target.value)}
                        placeholder="Casa, Trabalho..."
                        className="h-10 rounded-xl bg-white border border-[rgba(92,3,49,0.15)] px-3 text-[12px] text-[var(--wine-900)] placeholder:text-[rgba(92,3,49,0.35)] focus:border-[var(--wine-800)] outline-none"
                      />
                    </div>

                    {/* CEP */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.55)]">CEP</label>
                      <input
                        type="text"
                        required
                        maxLength={9}
                        value={formCep}
                        onChange={handleCepChange}
                        placeholder="00000-000"
                        className="h-10 rounded-xl bg-white border border-[rgba(92,3,49,0.15)] px-3 text-[12px] text-[var(--wine-900)] placeholder:text-[rgba(92,3,49,0.35)] focus:border-[var(--wine-800)] outline-none"
                      />
                    </div>
                  </div>

                  {/* Logradouro */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.55)]">Endereço/Rua</label>
                    <input
                      type="text"
                      required
                      value={formStreet}
                      onChange={(e) => setFormStreet(e.target.value)}
                      placeholder="Rua, Avenida..."
                      className="h-10 rounded-xl bg-white border border-[rgba(92,3,49,0.15)] px-3 text-[12px] text-[var(--wine-900)] placeholder:text-[rgba(92,3,49,0.35)] focus:border-[var(--wine-800)] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Número */}
                    <div className="flex flex-col gap-1 col-span-1">
                      <label className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.55)]">Número</label>
                      <input
                        type="text"
                        required
                        value={formNumber}
                        onChange={(e) => setFormNumber(e.target.value)}
                        placeholder="123"
                        className="h-10 rounded-xl bg-white border border-[rgba(92,3,49,0.15)] px-3 text-[12px] text-[var(--wine-900)] placeholder:text-[rgba(92,3,49,0.35)] focus:border-[var(--wine-800)] outline-none"
                      />
                    </div>

                    {/* Complemento */}
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.55)]">Complemento</label>
                      <input
                        type="text"
                        value={formComplement}
                        onChange={(e) => setFormComplement(e.target.value)}
                        placeholder="Apto, Bloco..."
                        className="h-10 rounded-xl bg-white border border-[rgba(92,3,49,0.15)] px-3 text-[12px] text-[var(--wine-900)] placeholder:text-[rgba(92,3,49,0.35)] focus:border-[var(--wine-800)] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Bairro */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.55)]">Bairro</label>
                      <input
                        type="text"
                        value={formNeighborhood}
                        onChange={(e) => setFormNeighborhood(e.target.value)}
                        placeholder="Bairro"
                        className="h-10 rounded-xl bg-white border border-[rgba(92,3,49,0.15)] px-3 text-[12px] text-[var(--wine-900)] placeholder:text-[rgba(92,3,49,0.35)] focus:border-[var(--wine-800)] outline-none"
                      />
                    </div>

                    {/* Cidade */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase tracking-wider text-[rgba(92,3,49,0.55)]">Cidade/Estado</label>
                      <input
                        type="text"
                        required
                        value={formCity ? `${formCity} - ${formState}` : ""}
                        readOnly
                        placeholder="Cidade/UF"
                        className="h-10 rounded-xl bg-white/40 border border-[rgba(92,3,49,0.08)] px-3 text-[12px] text-[rgba(92,3,49,0.55)] outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Definir Padrão checkbox */}
                  <div className="flex items-center gap-2.5 mt-1 select-none">
                    <input
                      type="checkbox"
                      id="isDefaultCheckbox"
                      checked={formIsDefault}
                      onChange={(e) => setFormIsDefault(e.target.checked)}
                      className="h-4 w-4 rounded bg-white border border-[rgba(92,3,49,0.25)] accent-[var(--wine-800)] focus:ring-0 outline-none"
                    />
                    <label htmlFor="isDefaultCheckbox" className="text-[11px] text-[var(--ink-500)] cursor-pointer">
                      Definir como Endereço Padrão
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                      }}
                      className="flex-1 h-10 rounded-xl border border-[rgba(92,3,49,0.2)] text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)] hover:bg-[rgba(92,3,49,0.05)] hover:text-[var(--wine-800)]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="flex-1 h-10 rounded-xl bg-[var(--wine-800)] hover:opacity-90 active:scale-[0.98] text-[var(--cream-100)] font-bold text-[11px] uppercase tracking-wider flex items-center justify-center disabled:opacity-50 shadow-[0_6px_18px_-10px_rgba(92,3,49,0.6)]"
                    >
                      {savingAddress ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Loader */}
              {loadingData && (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--wine-800)] border-t-transparent" />
                </div>
              )}

              {/* Empty state */}
              {!loadingData && addresses.length === 0 && !showAddressForm && (
                <div className="flex flex-col items-center justify-center p-8 rounded-[22px] border border-[rgba(92,3,49,0.08)] bg-white/50 text-center">
                  <IconPin size={32} className="text-[rgba(92,3,49,0.3)] mb-3" />
                  <span className="text-[12px] font-bold text-[var(--wine-900)]">Nenhum endereço salvo</span>
                  <p className="text-[11px] text-[var(--ink-500)] mt-1 max-w-[200px]">Cadastre seus locais frequentes para facilitar os agendamentos.</p>
                </div>
              )}

              {/* Address List */}
              <div className="flex flex-col gap-3.5">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`flex items-start justify-between rounded-[22px] p-4.5 border transition-all ${addr.is_default ? "border-[rgba(92,3,49,0.3)] bg-white/70 shadow-[0_8px_32px_-12px_rgba(92,3,49,0.18)]" : "border-[rgba(92,3,49,0.08)] bg-white/50"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 shrink-0 ${addr.is_default ? "text-[var(--wine-800)]" : "text-[rgba(92,3,49,0.35)]"}`}>
                        <IconPin size={18} />
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-[var(--wine-900)]">{addr.label}</span>
                          {addr.is_default && (
                            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--wine-800)]/10 text-[var(--wine-800)] border border-[var(--wine-800)]/20">
                              Padrão
                            </span>
                          )}
                        </div>
                        <span className="text-[12px] text-[var(--ink-500)] mt-1 leading-relaxed">
                          {addr.street}, nº {addr.number}
                          {addr.complement && ` · ${addr.complement}`}
                        </span>
                        <span className="text-[10px] text-[rgba(92,3,49,0.45)] mt-0.5 uppercase tracking-wider">
                          {addr.neighborhood ? `${addr.neighborhood}, ` : ""}{addr.city} - {addr.state}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1 items-center shrink-0">
                      {!addr.is_default && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="p-2 text-[rgba(92,3,49,0.35)] hover:text-[var(--wine-800)] transition-colors"
                          title="Definir como Padrão"
                        >
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddress(addr);
                          setShowAddressForm(true);
                        }}
                        className="p-2 text-[rgba(92,3,49,0.35)] hover:text-[var(--wine-900)] transition-colors"
                      >
                        <IconEdit size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id, addr.is_default)}
                        className="p-2 text-[rgba(92,3,49,0.35)] hover:text-rose-600 transition-colors"
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "favoritos" && (
            <motion.div
              key="favoritos-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 w-full"
            >
              {/* Favorites Title Header */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--wine-800)]">Minhas Profissionais</span>
                <span className="text-[10px] text-[var(--ink-500)]">Favoritas</span>
              </div>

              {/* Database Favorites (if any) */}
              {favorites.map((fav) => {
                const prof = fav.professional_profile;
                if (!prof) return null;
                return (
                  <div
                    key={fav.id}
                    className="flex gap-4 rounded-[22px] p-4 border border-[rgba(92,3,49,0.08)] bg-white/55 items-center hover:bg-white/70 transition-all"
                  >
                    <div className="h-14 w-14 rounded-full overflow-hidden border border-[rgba(92,3,49,0.12)] shrink-0">
                      {prof.user?.avatar_url ? (
                        <img src={prof.user.avatar_url} alt={prof.user.full_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-wine-800 flex items-center justify-center text-[var(--cream-100)] font-bold uppercase">
                          {prof.user?.full_name?.[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-[13px] font-semibold text-[var(--wine-900)] truncate">{prof.user?.full_name}</span>
                      <span className="text-[10px] text-[var(--wine-800)] mt-0.5 uppercase tracking-wider font-bold">Profissional Real</span>
                      <span className="text-[11px] text-[var(--ink-500)] truncate mt-1">{prof.bio || "Sem biografia cadastrada."}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFavoriteReal(fav.professional_id, fav.id)}
                      className="p-2.5 text-[var(--wine-800)] hover:text-[rgba(92,3,49,0.35)] transition-colors shrink-0"
                    >
                      <IconHeart size={18} fill="currentColor" />
                    </button>
                  </div>
                );
              })}

              {/* Test / Mock Favorites suggestions */}
              <div className="mt-2 flex flex-col gap-3.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[rgba(92,3,49,0.45)]">Sugestões de Favoritas (Demonstração)</span>
                {MOCK_PROFESSIONALS.map((prof) => {
                  const isFav = localMockFavorites.includes(prof.id);
                  return (
                    <div
                      key={prof.id}
                      onClick={() => setSelectedProfId(prof.id)}
                      className="flex gap-4 rounded-[22px] p-4 border border-[rgba(92,3,49,0.08)] bg-white/55 hover:bg-white/70 transition-all items-center cursor-pointer active:scale-[0.98]"
                    >
                      <div className="h-14 w-14 rounded-full overflow-hidden border border-[rgba(92,3,49,0.12)] shrink-0">
                        <img src={prof.avatarUrl} alt={prof.name} className="h-full w-full object-cover" />
                      </div>

                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-[var(--wine-900)] truncate">{prof.name}</span>
                          <div className="flex items-center gap-0.5 text-amber-600 shrink-0 mt-0.5">
                            <IconStar size={10} />
                            <span className="text-[9px] font-bold text-[var(--ink-500)]">{prof.rating}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-[rgba(92,3,49,0.5)] mt-0.5 uppercase tracking-wider">{prof.specialty} · {prof.city}</span>
                        <span className="text-[11px] text-[var(--ink-500)] truncate mt-1.5 leading-relaxed">{prof.bio}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleToggleMockFavorite(prof.id); }}
                        className={`p-2.5 transition-colors shrink-0 ${isFav ? "text-[var(--wine-800)] hover:text-[rgba(92,3,49,0.35)]" : "text-[rgba(92,3,49,0.25)] hover:text-[var(--wine-800)]"}`}
                      >
                        <IconHeart size={18} fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "agendamentos" && (
            <motion.div
              key="agendamentos-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 w-full"
            >
              {/* Header stats */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--wine-800)]">Histórico de Serviços</span>
                <span className="text-[10px] text-[var(--ink-500)]">Total: {bookings.length + MOCK_BOOKINGS.length}</span>
              </div>

              {/* Lista unificada agrupada: Pendente → Confirmado → Concluído → Cancelado */}
              {(() => {
                const getGroupIndex = (status: string) => {
                  if (status === "pending") return 0;
                  if (["accepted", "on_the_way", "arrived", "started", "in_progress"].includes(status)) return 1;
                  if (status === "completed") return 2;
                  return 3;
                };

                const allBookings = [
                  ...bookings,
                  ...MOCK_BOOKINGS.map((bk) => ({ ...bk, status: mockStatuses[bk.id] ?? bk.status })),
                ];
                const groups = [0, 1, 2, 3]
                  .map((gi) => allBookings.filter((bk) => getGroupIndex(bk.status) === gi))
                  .filter((g) => g.length > 0);

                return groups.flatMap((group, gi) => [
                  ...(gi > 0 ? [
                    <div key={`sep-${gi}`} className="flex items-center gap-2 py-1">
                      <div className="flex-1 border-t border-dashed" style={{ borderColor: "rgba(92,3,49,0.18)" }} />
                      <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "rgba(92,3,49,0.22)" }} />
                      <div className="flex-1 border-t border-dashed" style={{ borderColor: "rgba(92,3,49,0.18)" }} />
                    </div>,
                  ] : []),
                  ...group.map((bk) => {
                    const statusInfo = getStatusLabel(bk.status);
                    const prof = bk.professional_profile;
                    const formattedDate = formatDateTime(bk.scheduled_at || bk.created_at);
                    const hasDetails = !!bk.address_snapshot;
                    const isPending = bk.status === "pending";

                    return (
                      <div
                        key={bk.id}
                        className="flex flex-col gap-3 rounded-[22px] p-4.5 border border-[rgba(92,3,49,0.08)] bg-white/55"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden border border-[rgba(92,3,49,0.12)] shrink-0">
                              {prof?.user?.avatar_url ? (
                                <img src={prof.user.avatar_url} alt={prof.user.full_name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-wine-800 flex items-center justify-center text-[var(--cream-100)] font-bold uppercase text-[12px]">
                                  {prof?.user?.full_name?.[0] ?? "P"}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[12px] font-bold text-[var(--wine-900)]">{prof?.user?.full_name ?? "Profissional POPYNS"}</span>
                              <span className="text-[10px] text-[var(--ink-500)] mt-0.5">{formattedDate}</span>
                            </div>
                          </div>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="border-t border-[rgba(92,3,49,0.08)] pt-3 flex flex-col gap-1.5">
                          <div className="flex justify-between text-[12px]">
                            <span className="text-[var(--ink-500)]">{bk.service_name || "Serviço POPYNS"}</span>
                            <span className="text-[var(--wine-900)] font-semibold">{formatCurrency(bk.total_cents)}</span>
                          </div>

                          {hasDetails && (
                            <div className="flex items-start gap-1.5 mt-1 text-[10px] text-[rgba(92,3,49,0.55)]">
                              <span className="mt-0.5 shrink-0"><IconPin size={12} /></span>
                              <span className="leading-relaxed">
                                {bk.address_snapshot.label && `[${bk.address_snapshot.label}] `}
                                {bk.address_snapshot.street}, {bk.address_snapshot.number}
                                {bk.address_snapshot.complement && ` · ${bk.address_snapshot.complement}`}
                              </span>
                            </div>
                          )}

                          {isPending && (
                            <div className="flex gap-2 mt-3">
                              <button
                                type="button"
                                onClick={() => handleConfirmBooking(bk.id)}
                                className="flex-1 h-7 rounded-full border text-[10px] font-bold uppercase tracking-wider active:scale-[0.98] transition-all text-pink-700 bg-pink-100 border-pink-200"
                                style={{ fontFamily: "var(--font-manrope)" }}
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(bk.id)}
                                className="flex-1 h-7 rounded-full border text-[10px] font-bold uppercase tracking-wider active:scale-[0.98] transition-all text-red-700 bg-red-100 border-red-200"
                                style={{ fontFamily: "var(--font-manrope)" }}
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }),
                ]);
              })()}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Tab bar flutuante */}
      <div className="absolute bottom-7 left-1/2 z-40 -translate-x-1/2">
        <div
          className="flex items-center gap-1 rounded-full p-2 shadow-[0_18px_36px_-18px_rgba(31,16,20,0.45)]"
          style={{ background: "var(--wine-900)" }}
        >
          {([
            { key: "mapa" as ActiveTab,         label: "Mapa"       },
            { key: "enderecos" as ActiveTab,     label: "Endereços"  },
            { key: "favoritos" as ActiveTab,     label: "Favoritos"  },
            { key: "agendamentos" as ActiveTab,  label: "Agenda"     },
            { key: "perfil" as ActiveTab,        label: "Perfil"     },
          ]).map(({ key, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveTab(key);
                  setShowAddressForm(false);
                  setEditingAddress(null);
                }}
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
                {key === "mapa" && <IconPin size={18} />}
                {key === "perfil" && <IconUser size={18} />}
                {key === "enderecos" && <IconHome size={18} />}
                {key === "favoritos" && <IconHeart size={18} />}
                {key === "agendamentos" && <IconCalendar size={18} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-[#5C0331]/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-[340px] rounded-[24px] border border-[rgba(92,3,49,0.15)] bg-white p-6 shadow-[0_20px_50px_-12px_rgba(92,3,49,0.4)] flex flex-col text-center"
            >
              <h3
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontStyle: "italic",
                  fontWeight: 600,
                  fontSize: "24px",
                  color: "var(--wine-800)",
                }}
                className="mb-2"
              >
                {confirmModal.title}
              </h3>
              <p
                style={{ fontFamily: "var(--font-manrope)" }}
                className="text-[13px] leading-relaxed text-[var(--ink-500)] mb-6"
              >
                {confirmModal.message}
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="flex-1 h-10 rounded-xl border border-[rgba(92,3,49,0.18)] text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)] hover:bg-[rgba(92,3,49,0.04)] transition-colors cursor-pointer"
                  style={{ fontFamily: "var(--font-manrope)" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="flex-1 h-10 rounded-xl bg-[var(--wine-800)] hover:bg-[var(--wine-900)] text-[var(--cream-100)] font-bold text-[11px] uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-[0_6px_18px_-10px_rgba(92,3,49,0.6)]"
                  style={{ fontFamily: "var(--font-manrope)" }}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Professional Profile Overlay */}
      <AnimatePresence>
        {selectedProfId && (() => {
          const prof = MOCK_PROFESSIONALS.find(p => p.id === selectedProfId);
          if (!prof) return null;
          const isFav = localMockFavorites.includes(prof.id);
          return (
            <motion.div key="prof-profile"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="absolute inset-0 z-[90] flex flex-col overflow-hidden"
              style={{ background: "var(--cream-100)", fontFamily: "var(--font-manrope)" }}>

              {/* Cover — sem avatar, apenas foto + botões */}
              <div className="relative shrink-0" style={{ height: 160 }}>
                <img src={prof.coverUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(92,3,49,0.18) 0%, rgba(92,3,49,0.5) 100%)" }}/>
                <button type="button" onClick={() => { setSelectedProfId(null); setVisibleReviewsCount(3); }}
                  className="absolute top-4 left-4 h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md"
                  style={{ background: "rgba(92,3,49,0.55)" }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button type="button" onClick={() => handleToggleMockFavorite(prof.id)}
                  className="absolute top-4 right-4 h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md"
                  style={{ background: "rgba(92,3,49,0.55)", color: isFav ? "#f9a8d4" : "white" }}>
                  <IconHeart size={16} fill={isFav ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Faixa dos selos — shrink-0, estática, avatar posicionado aqui subindo pro cover */}
              <div className="shrink-0 relative" style={{ height: 52, background: "var(--cream-100)", overflow: "visible" }}>
                {/* Avatar sobe 34px acima desta faixa, entrando no cover */}
                <div className="absolute rounded-full border-4 border-white overflow-hidden shadow-lg"
                  style={{ top: -34, left: 20, width: 80, height: 80, zIndex: 20 }}>
                  <img src={prof.avatarUrl} alt={prof.name} className="h-full w-full object-cover" />
                </div>
                {/* Selos — circleStyle idêntico ao PopynsLogo, sem fundo */}
                <div className="absolute flex items-center gap-[6px]" style={{ top: "50%", transform: "translateY(-50%)", left: 104 }}>
                  {[1,2,3,4,5].map((n) => {
                    const active = n <= (prof.seals ?? 0);
                    const size = 12;
                    const diameter = size * 1.2;
                    const borderWidth = Math.max(2, diameter * 0.06);
                    const fontSize = diameter * 0.74;
                    const ink = "#5C0331";
                    return (
                      <span key={n} style={{
                        width: diameter, height: diameter,
                        borderRadius: "9999px",
                        border: `${borderWidth}px solid ${ink}`,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-poppins)",
                        fontWeight: 800,
                        fontSize: fontSize,
                        lineHeight: 1,
                        color: ink,
                        flexShrink: 0,
                        opacity: active ? 1 : 0.25,
                        userSelect: "none",
                      }}>P</span>
                    );
                  })}
                </div>
              </div>

              {/* Conteúdo scrollável */}
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: 40 }}>
                {/* Name + info */}
                <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(92,3,49,0.08)" }}>
                  <h1 className="text-[22px] font-bold" style={{ color: "var(--wine-900)", fontFamily: "var(--font-cormorant)", lineHeight: 1.2 }}>{prof.name}</h1>
                  <p className="text-[12px] mt-1 font-semibold uppercase tracking-wider" style={{ color: "rgba(92,3,49,0.5)" }}>{prof.specialty}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth={1}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span className="text-[12px] font-bold" style={{ color: "var(--wine-900)" }}>{prof.rating}</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(92,3,49,0.45)" }}>·</span>
                    <div className="flex items-center gap-1" style={{ color: "rgba(92,3,49,0.45)" }}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx={12} cy={10} r={3}/></svg>
                      <span className="text-[11px]">{prof.city}</span>
                    </div>
                  </div>
                </div>

                {/* Especialidades */}
                <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(92,3,49,0.08)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: "rgba(92,3,49,0.45)" }}>Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {prof.services.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                        style={{ background: "rgba(92,3,49,0.07)", color: "var(--wine-800)" }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(92,3,49,0.08)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: "rgba(92,3,49,0.45)" }}>Sobre</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-500)" }}>{prof.bio}</p>
                </div>

                {/* Certifications */}
                <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(92,3,49,0.08)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-4" style={{ color: "rgba(92,3,49,0.45)" }}>Certificações</p>
                  <div className="flex flex-col gap-4">
                    {prof.certifications.map((cert, i) => (
                      <div key={i} className="rounded-[18px] overflow-hidden border" style={{ borderColor: "rgba(92,3,49,0.1)", background: "white" }}>
                        {/* Certificate preview */}
                        <div className="w-full flex items-center justify-center px-5 py-4" style={{ background: "linear-gradient(135deg,#fdf6ee 0%,#f5e9d8 100%)", height: 140, position: "relative" }}>
                          {/* Decorative corner borders */}
                          <div style={{ position:"absolute", top:10, left:10, width:18, height:18, borderTop:"2px solid rgba(92,3,49,0.35)", borderLeft:"2px solid rgba(92,3,49,0.35)", borderRadius:"2px 0 0 0" }}/>
                          <div style={{ position:"absolute", top:10, right:10, width:18, height:18, borderTop:"2px solid rgba(92,3,49,0.35)", borderRight:"2px solid rgba(92,3,49,0.35)", borderRadius:"0 2px 0 0" }}/>
                          <div style={{ position:"absolute", bottom:10, left:10, width:18, height:18, borderBottom:"2px solid rgba(92,3,49,0.35)", borderLeft:"2px solid rgba(92,3,49,0.35)", borderRadius:"0 0 0 2px" }}/>
                          <div style={{ position:"absolute", bottom:10, right:10, width:18, height:18, borderBottom:"2px solid rgba(92,3,49,0.35)", borderRight:"2px solid rgba(92,3,49,0.35)", borderRadius:"0 0 2px 0" }}/>
                          {/* Inner content */}
                          <div className="flex flex-col items-center gap-1.5 text-center">
                            {/* Seal icon */}
                            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(92,3,49,0.5)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                              <circle cx={12} cy={8} r={6}/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                            </svg>
                            <p className="text-[11px] font-bold leading-tight px-4" style={{ color:"var(--wine-800)", fontFamily:"var(--font-cormorant)", fontSize:14, lineHeight:1.3 }}>{cert.name}</p>
                            <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color:"rgba(92,3,49,0.45)" }}>{cert.issuer}</p>
                            <div style={{ width:40, height:1, background:"rgba(92,3,49,0.2)", marginTop:2 }}/>
                            <p className="text-[9px]" style={{ color:"rgba(92,3,49,0.4)" }}>{cert.date}</p>
                          </div>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-[13px] font-bold" style={{ color: "var(--wine-900)" }}>{cert.name}</p>
                          {cert.description && (
                            <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: "rgba(92,3,49,0.55)" }}>{cert.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Avaliações */}
                {prof.reviews && prof.reviews.length > 0 && (
                  <div className="px-5 py-5">
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(92,3,49,0.45)" }}>Avaliações</p>
                      <span className="text-[10px]" style={{ color: "rgba(92,3,49,0.35)" }}>({prof.reviews.length})</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-4">
                      {[1,2,3,4,5].map((s) => (
                        <svg key={s} width={13} height={13} viewBox="0 0 24 24" fill={s <= Math.round(prof.rating) ? "#d97706" : "none"} stroke="#d97706" strokeWidth={1.8}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                      <span className="text-[12px] font-bold ml-1" style={{ color: "var(--wine-900)" }}>{prof.rating} de 5</span>
                    </div>

                    <div className="flex flex-col">
                      {prof.reviews.slice(0, visibleReviewsCount).map((review, i) => (
                        <div key={review.id} className="flex flex-col gap-2 py-4" style={{ borderTop: i > 0 ? "1px solid rgba(92,3,49,0.08)" : "none" }}>
                          {/* Cliente */}
                          <div className="flex items-center gap-2.5">
                            {review.clientPhoto ? (
                              <img src={review.clientPhoto} alt={review.clientName} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(92,3,49,0.1)" }}>
                                <span className="text-[11px] font-bold uppercase" style={{ color: "var(--wine-800)" }}>
                                  {review.clientName[0]}
                                </span>
                              </div>
                            )}
                            <span className="text-[13px] font-semibold" style={{ color: "var(--wine-900)", fontFamily: "var(--font-manrope)" }}>
                              {review.clientName}
                            </span>
                          </div>

                          {/* Estrelas + título */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-[2px]">
                              {[1,2,3,4,5].map((s) => (
                                <svg key={s} width={13} height={13} viewBox="0 0 24 24" fill={s <= review.rating ? "#d97706" : "none"} stroke="#d97706" strokeWidth={1.8}>
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                              ))}
                            </div>
                            <span className="text-[12px] font-bold" style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}>
                              {review.title}
                            </span>
                          </div>

                          {/* Data + especialidade */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px]" style={{ color: "rgba(92,3,49,0.45)", fontFamily: "var(--font-manrope)" }}>
                              Avaliado em {review.date}
                            </span>
                            <span style={{ color: "rgba(92,3,49,0.25)" }}>·</span>
                            <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: "rgba(92,3,49,0.07)", color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}>
                              {review.specialty}
                            </span>
                          </div>

                          {/* Comentário */}
                          <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-500)", fontFamily: "var(--font-manrope)" }}>
                            {review.comment}
                          </p>
                        </div>
                      ))}
                    </div>

                    {visibleReviewsCount < prof.reviews.length && (
                      <button
                        type="button"
                        onClick={() => setVisibleReviewsCount((n) => n + 3)}
                        className="mt-1 w-full text-center text-[12px] transition-opacity hover:opacity-60 active:opacity-40"
                        style={{
                          color: "rgba(92,3,49,0.45)",
                          fontFamily: "var(--font-manrope)",
                          textDecoration: "underline",
                          textUnderlineOffset: "3px",
                          textDecorationColor: "rgba(92,3,49,0.25)",
                        }}
                      >
                        Veja mais avaliações
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* CTA button */}
              <div className="px-5 pb-10 pt-4 shrink-0" style={{ background: "var(--cream-100)", borderTop: "1px solid rgba(92,3,49,0.08)" }}>
                <button type="button"
                  className="w-full h-12 rounded-full text-[13px] font-bold uppercase tracking-wider"
                  style={{ background: "var(--wine-800)", color: "var(--cream-100)" }}>
                  Agendar Serviço
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] w-[calc(100%-40px)] max-w-[350px] shadow-[0_12px_40px_-12px_rgba(92,3,49,0.25)] rounded-2xl border p-4 flex items-center gap-3 backdrop-blur-md"
            style={{
              fontFamily: "var(--font-manrope)",
              backgroundColor: 
                toast.type === "add" 
                  ? "rgba(240, 253, 244, 0.95)" 
                  : toast.type === "edit"
                  ? "rgba(239, 246, 255, 0.95)" 
                  : toast.type === "delete"
                  ? "rgba(254, 242, 242, 0.95)" 
                  : toast.type === "default"
                  ? "rgba(255, 251, 235, 0.95)" 
                  : "rgba(254, 242, 242, 0.95)",
              borderColor: 
                toast.type === "add"
                  ? "rgba(74, 222, 128, 0.4)"
                  : toast.type === "edit"
                  ? "rgba(96, 165, 250, 0.4)"
                  : toast.type === "delete"
                  ? "rgba(248, 113, 113, 0.4)"
                  : toast.type === "default"
                  ? "rgba(251, 191, 36, 0.4)"
                  : "rgba(248, 113, 113, 0.4)",
            }}
          >
            {/* Icon */}
            {toast.type === "add" && (
              <span className="text-emerald-600 shrink-0">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx={12} cy={12} r={10} />
                  <line x1={12} y1={8} x2={12} y2={16} />
                  <line x1={8} y1={12} x2={16} y2={12} />
                </svg>
              </span>
            )}
            {toast.type === "edit" && (
              <span className="text-blue-600 shrink-0">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </span>
            )}
            {toast.type === "delete" && (
              <span className="text-rose-600 shrink-0">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </span>
            )}
            {toast.type === "default" && (
              <span className="text-amber-600 shrink-0">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </span>
            )}
            {toast.type === "error" && (
              <span className="text-rose-600 shrink-0">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx={12} cy={12} r={10} />
                  <line x1={12} y1={8} x2={12} y2={12} />
                  <line x1={12} y1={16} x2={12} y2={16} />
                </svg>
              </span>
            )}

            {/* Message Text */}
            <span 
              className={`text-[12px] font-semibold ${
                toast.type === "add" 
                  ? "text-emerald-900" 
                  : toast.type === "edit"
                  ? "text-blue-900"
                  : toast.type === "delete"
                  ? "text-rose-900"
                  : toast.type === "default"
                  ? "text-amber-900"
                  : "text-rose-900"
              }`}
            >
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
