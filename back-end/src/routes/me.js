import { Router } from 'express';
import { getAuth, requireAuth } from '@clerk/express';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// GET /api/me — devolve o perfil do usuário logado, com professional_profile
// e selos quando aplicável. Exemplo de endpoint protegido por JWT do Clerk.
router.get('/me', requireAuth(), async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(
        `
        id,
        clerk_user_id,
        email,
        full_name,
        phone,
        avatar_url,
        is_professional,
        preferred_payment_method,
        created_at,
        professional_profile:professional_profiles (
          id,
          bio,
          cover_url,
          base_city,
          base_state,
          is_online,
          service_radius_km,
          total_jobs,
          average_rating,
          total_ratings,
          commission_rate,
          badges:professional_badges (
            granted_at,
            badge:badges ( slug, name, icon, sort_order )
          )
        )
        `,
      )
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado no banco. Webhook do Clerk pode estar atrasado.',
      });
    }

    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
