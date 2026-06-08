"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
}

/**
 * Hook que devolve um cliente Supabase autenticado com o JWT da sessão Clerk.
 *
 * O Supabase verifica o JWT via integração Third-Party Auth (Dashboard →
 * Authentication → Sign In/Up → Third-Party Auth → Clerk). O claim `sub` do
 * JWT é o clerk_user_id — é nele que as RLS policies se apoiam.
 *
 * `accessToken` é re-executado a cada request do Supabase, então o cliente é
 * memoizado por sessão; quando o usuário desloga, um novo cliente é criado
 * e passa a devolver `null` no token.
 */
export function useSupabase(): SupabaseClient {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      accessToken: async () => {
        if (!session) return null;
        return (await session.getToken()) ?? null;
      },
    });
  }, [session]);
}

export const SUPABASE_BUCKET = "popyns";

/** Devolve a extensão (sem o ponto) ou "jpg" como fallback. */
export function fileExt(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  const fromMime = file.type.split("/").pop()?.toLowerCase();
  return fromMime ?? "jpg";
}

/** Path padrão de avatar dentro do bucket popyns. */
export function avatarPath(clerkUserId: string, file: File): string {
  return `${clerkUserId}/avatar/profile.${fileExt(file)}`;
}
