import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? ''
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''

/** Do not create a client with empty config — @supabase/supabase-js throws on invalid URLs. */
export const supabase: SupabaseClient | null =
  url.length > 0 && key.length > 0
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null

export function isSupabaseConfigured(): boolean {
  return supabase !== null
}
