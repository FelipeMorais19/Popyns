import { Webhook } from "svix";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ClerkEmail = { id: string; email_address: string };
type ClerkPhone = { id: string; phone_number: string };

type ClerkUserData = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string | null;
  phone_numbers?: ClerkPhone[];
  primary_phone_number_id?: string | null;
  unsafe_metadata?: Record<string, unknown> | null;
};

type ClerkDeletedData = { id: string; deleted?: boolean };

type ClerkEvent =
  | { type: "user.created" | "user.updated"; data: ClerkUserData }
  | { type: "user.deleted"; data: ClerkDeletedData }
  | { type: string; data: unknown };

function primaryEmail(u: ClerkUserData): string | null {
  if (!u.email_addresses?.length) return null;
  const primary = u.email_addresses.find((e) => e.id === u.primary_email_address_id);
  return (primary ?? u.email_addresses[0]).email_address ?? null;
}

function primaryPhone(u: ClerkUserData): string | null {
  if (!u.phone_numbers?.length) return null;
  const primary = u.phone_numbers.find((p) => p.id === u.primary_phone_number_id);
  return (primary ?? u.phone_numbers[0]).phone_number ?? null;
}

function fullName(u: ClerkUserData): string | null {
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || null;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return new Response("server misconfigured", { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("missing svix headers", { status: 400 });
  }

  const body = await req.text();

  let event: ClerkEvent;
  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("invalid signature", { status: 401 });
  }

  const db = supabaseAdmin();

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const u = event.data as ClerkUserData;
      const email = primaryEmail(u);
      if (!email) {
        console.warn(`Clerk ${event.type} for ${u.id} has no email; skipping`);
        return new Response("skipped: no email", { status: 200 });
      }

      const tipo = (u.unsafe_metadata?.tipo as string | undefined) ?? null;
      const row = {
        clerk_user_id: u.id,
        email,
        full_name: fullName(u),
        phone: primaryPhone(u),
        avatar_url: u.image_url || null,
        is_professional: tipo === "profissional",
      };

      const { error } = await db
        .from("users")
        .upsert(row, { onConflict: "clerk_user_id" });
      if (error) {
        console.error("upsert users failed:", error);
        return new Response("db error", { status: 500 });
      }
      return new Response("ok", { status: 200 });
    }

    if (event.type === "user.deleted") {
      const u = event.data as ClerkDeletedData;
      const { error } = await db
        .from("users")
        .delete()
        .eq("clerk_user_id", u.id);
      if (error) {
        console.error("delete users failed:", error);
        return new Response("db error", { status: 500 });
      }
      return new Response("ok", { status: 200 });
    }

    return new Response("ignored", { status: 200 });
  } catch (err) {
    console.error("Webhook handler crashed:", err);
    return new Response("server error", { status: 500 });
  }
}
