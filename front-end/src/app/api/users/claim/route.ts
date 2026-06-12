import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// POST /api/users/claim
//
// Reconcilia a linha em public.users do usuário logado e devolve o uuid.
// Cobre o caso "mesmo email, novo clerk_user_id" (ex: trocou de provedor
// e o Clerk emitiu um sub diferente) que o upsert direto do front-end não
// consegue resolver — RLS de UPDATE em users exige clerk_user_id = JWT.sub.
//
// Fluxo:
//   1) busca por clerk_user_id  → se achar, retorna.
//   2) busca por email          → se achar, faz UPDATE do clerk_user_id e retorna.
//   3) caso contrário, INSERT.
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const email = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;

  if (!email) {
    return Response.json({ error: "no_email_on_clerk_user" }, { status: 400 });
  }

  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const phone =
    clerkUser.phoneNumbers.find((p) => p.id === clerkUser.primaryPhoneNumberId)
      ?.phoneNumber ??
    clerkUser.phoneNumbers[0]?.phoneNumber ??
    null;
  const avatarUrl = clerkUser.imageUrl || null;
  const isProfessional =
    (clerkUser.unsafeMetadata as { tipo?: string } | undefined)?.tipo ===
    "profissional";

  const db = supabaseAdmin();

  const { data: byClerk, error: byClerkErr } = await db
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (byClerkErr) {
    console.error("[users/claim] lookup by clerk_user_id failed:", byClerkErr);
    return Response.json({ error: "db_error" }, { status: 500 });
  }
  if (byClerk?.id) {
    return Response.json({ id: byClerk.id, reconciled: false });
  }

  const { data: byEmail, error: byEmailErr } = await db
    .from("users")
    .select("id, clerk_user_id")
    .eq("email", email)
    .maybeSingle();
  if (byEmailErr) {
    console.error("[users/claim] lookup by email failed:", byEmailErr);
    return Response.json({ error: "db_error" }, { status: 500 });
  }

  if (byEmail?.id) {
    const { error: updateErr } = await db
      .from("users")
      .update({
        clerk_user_id: userId,
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
        is_professional: isProfessional,
      })
      .eq("id", byEmail.id);
    if (updateErr) {
      console.error("[users/claim] reclaim update failed:", updateErr);
      return Response.json({ error: "db_error" }, { status: 500 });
    }
    return Response.json({ id: byEmail.id, reconciled: true });
  }

  const { data: inserted, error: insertErr } = await db
    .from("users")
    .insert({
      clerk_user_id: userId,
      email,
      full_name: fullName,
      phone,
      avatar_url: avatarUrl,
      is_professional: isProfessional,
    })
    .select("id")
    .single();
  if (insertErr || !inserted) {
    console.error("[users/claim] insert failed:", insertErr);
    return Response.json({ error: "db_error" }, { status: 500 });
  }
  return Response.json({ id: inserted.id, reconciled: false, created: true });
}
