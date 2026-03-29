import type { RealtimeChannel } from '@supabase/supabase-js'
import { bumpRealtime, setOrders } from '../store/authSlice'
import type { AppDispatch } from '../store'
import { fetchOrdersForProfile } from './api'
import { supabase } from './supabase'
import type { UserProfile } from '../types/roles'

async function syncOrders(dispatch: AppDispatch, user: UserProfile) {
  try {
    const orders = await fetchOrdersForProfile(user)
    dispatch(setOrders(orders))
  } catch {
    /* non-fatal: RLS or network */
  }
}

export function startRealtime(dispatch: AppDispatch, user: UserProfile | null) {
  const client = supabase
  if (!user || !client) {
    return () => undefined
  }

  void syncOrders(dispatch, user)

  const channels: RealtimeChannel[] = []

  const push = () => {
    dispatch(bumpRealtime())
    void syncOrders(dispatch, user)
  }

  channels.push(
    client
      .channel(`orders-${user.id.slice(0, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, push)
      .subscribe(),
  )

  channels.push(
    client
      .channel(`production_tasks-${user.id.slice(0, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_tasks' }, push)
      .subscribe(),
  )

  return () => {
    channels.forEach((ch) => void client.removeChannel(ch))
  }
}
