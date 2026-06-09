import { createClient } from "@supabase/supabase-js";

import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

export function createSupabaseBrowserClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}

export function createSupabaseAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
