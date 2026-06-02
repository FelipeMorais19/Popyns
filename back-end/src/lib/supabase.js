import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Cliente service-role. Bypassa RLS. Use SOMENTE no servidor — nunca expor pro front.
// Para endpoints onde precisamos identificar o usuário, validamos o JWT do Clerk
// no middleware e fazemos as queries com este cliente passando o clerk_user_id.
export const supabaseAdmin = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
