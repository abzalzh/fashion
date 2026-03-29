import { supabase } from '../lib/supabase'
import type { UserProfile, UserRole } from '../types/roles'

export async function loadProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, display_name')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return {
    id: data.id,
    email: data.email,
    role: data.role as UserRole,
    displayName: (data.display_name as string | null) ?? null,
  }
}
