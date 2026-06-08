import { Router, raw } from 'express';
import { Webhook } from 'svix';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

const router = Router();

// IMPORTANTE: svix verifica a assinatura sobre o body cru (bytes).
// Por isso usamos `raw` neste router (e nada de express.json() antes).
router.post(
  '/clerk/webhook',
  raw({ type: 'application/json' }),
  async (req, res, next) => {
    if (!env.clerk.webhookSigningSecret) {
      logger.error('CLERK_WEBHOOK_SIGNING_SECRET not set; cannot verify webhook');
      return res.status(503).json({
        error: 'Webhook not configured. Set CLERK_WEBHOOK_SIGNING_SECRET in .env and restart.',
      });
    }

    const svixId = req.header('svix-id');
    const svixTimestamp = req.header('svix-timestamp');
    const svixSignature = req.header('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    let event;
    try {
      const wh = new Webhook(env.clerk.webhookSigningSecret);
      event = wh.verify(req.body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      logger.warn({ err: err.message }, 'Invalid Clerk webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    try {
      await handleEvent(event);
      return res.status(200).json({ received: true });
    } catch (err) {
      logger.error({ err, eventType: event.type }, 'Error handling Clerk webhook');
      return next(err);
    }
  },
);

async function handleEvent(event) {
  switch (event.type) {
    case 'user.created':
    case 'user.updated':
      return upsertUser(event.data);
    case 'user.deleted':
      return deleteUser(event.data);
    default:
      logger.debug({ type: event.type }, 'Ignoring Clerk event');
      return null;
  }
}

function primaryEmail(userData) {
  const primaryId = userData.primary_email_address_id;
  const found = userData.email_addresses?.find((e) => e.id === primaryId);
  return (
    found?.email_address ??
    userData.email_addresses?.[0]?.email_address ??
    null
  );
}

function fullName(userData) {
  const parts = [userData.first_name, userData.last_name].filter(Boolean);
  return parts.join(' ').trim() || null;
}

function primaryPhone(userData) {
  const primaryId = userData.primary_phone_number_id;
  const found = userData.phone_numbers?.find((p) => p.id === primaryId);
  return (
    found?.phone_number ??
    userData.phone_numbers?.[0]?.phone_number ??
    userData.unsafe_metadata?.phone ??
    null
  );
}

async function upsertUser(userData) {
  const email = primaryEmail(userData);
  if (!email) {
    logger.warn({ clerkUserId: userData.id }, 'Clerk user has no email; skipping');
    return;
  }

  const isProfessional = userData.unsafe_metadata?.tipo === 'profissional';

  const payload = {
    clerk_user_id: userData.id,
    email,
    full_name: fullName(userData),
    phone: primaryPhone(userData),
    avatar_url: userData.image_url ?? null,
    is_professional: isProfessional,
  };

  const { data: userRow, error } = await supabaseAdmin
    .from('users')
    .upsert(payload, { onConflict: 'clerk_user_id' })
    .select('id')
    .single();

  if (error) {
    logger.error({ err: error, clerkUserId: userData.id }, 'Failed to upsert user');
    throw error;
  }
  logger.info({ clerkUserId: userData.id, email, uuid: userRow?.id }, 'Synced user');

  if (isProfessional && userRow) {
    const rawRadius = userData.unsafe_metadata?.serviceRadius;
    const serviceRadius = rawRadius ? parseInt(rawRadius, 10) : 5;

    const profPayload = {
      user_id: userRow.id,
      bio: userData.unsafe_metadata?.bio ?? null,
      base_city: userData.unsafe_metadata?.baseCity ?? null,
      service_radius_km: isNaN(serviceRadius) ? 5 : serviceRadius,
    };

    const { error: profError } = await supabaseAdmin
      .from('professional_profiles')
      .upsert(profPayload, { onConflict: 'user_id' });

    if (profError) {
      logger.error({ err: profError, userId: userRow.id }, 'Failed to upsert professional profile');
      throw profError;
    }
    logger.info({ userId: userRow.id }, 'Synced professional profile');
  }
}

async function deleteUser(userData) {
  if (!userData.id) return;
  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('clerk_user_id', userData.id);

  if (error) throw error;
  logger.info({ clerkUserId: userData.id }, 'Deleted user');
}

export default router;
