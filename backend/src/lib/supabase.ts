import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _client: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!_client) {
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — Supabase auth unavailable');
      return null;
    }
    try {
      _client = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to initialize Supabase client');
      return null;
    }
  }
  return _client;
}

export { getSupabaseClient };
export const supabaseAdmin = getSupabaseClient();
