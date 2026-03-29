import { supabase } from './supabase'
import type { OrderStatus, OrderView, ProductView, ProductionTaskView } from '../types/domain'
import type { UserProfile } from '../types/roles'

function bad(message: string): Error {
  return new Error(message)
}

function mapProductRow(p: {
  id: string
  slug: string
  title: string
  description: string | null
  price_cents: number
  in_stock: boolean
  image_url: string | null
}): ProductView {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    priceCents: p.price_cents,
    inStock: p.in_stock,
    imageUrl: p.image_url,
  }
}

type OrderRow = {
  id: string
  status: OrderStatus
  created_at: string
  is_preorder: boolean
  preorder_ready_date: string | null
  customer_id: string
  products: { title: string; price_cents: number } | { title: string; price_cents: number }[] | null
  profiles?: { email: string } | { email: string }[] | null
  production_tasks:
    | { id: string; step_index: number; label: string; completed_at: string | null }[]
    | null
}

function normalizeOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function mapOrderRow(row: OrderRow): OrderView {
  const prod = normalizeOne(row.products)
  const prof = normalizeOne(row.profiles)
  const tasks = row.production_tasks ?? []
  const taskViews: ProductionTaskView[] = tasks
    .slice()
    .sort((a, b) => a.step_index - b.step_index)
    .map((t) => ({
      id: t.id,
      stepIndex: t.step_index,
      label: t.label,
      completed: t.completed_at != null,
    }))
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    productTitle: prod?.title ?? 'PRODUCT',
    priceCents: prod?.price_cents ?? 0,
    customerEmail: prof?.email,
    isPreorder: row.is_preorder,
    preorderReadyDate: row.preorder_ready_date,
    tasks: taskViews,
  }
}

export async function fetchProducts(): Promise<ProductView[]> {
  if (!supabase) throw bad('Supabase is not configured')
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, title, description, price_cents, in_stock, image_url')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapProductRow)
}

export async function fetchOrdersForProfile(user: UserProfile): Promise<OrderView[]> {
  if (!supabase) throw bad('Supabase is not configured')

  const base =
    'id, status, created_at, customer_id, is_preorder, preorder_ready_date, products ( title, price_cents ), production_tasks ( id, step_index, label, completed_at )'

  if (user.role === 'customer') {
    const { data, error } = await supabase
      .from('orders')
      .select(base)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as OrderRow[]).map(mapOrderRow)
  }

  const q =
    user.role === 'franchisee'
      ? supabase
          .from('orders')
          .select(`${base}, profiles ( email )`)
          .order('created_at', { ascending: false })
      : supabase
          .from('orders')
          .select(base)
          .eq('status', 'IN_PRODUCTION')
          .order('created_at', { ascending: true })

  const { data, error } = await q
  if (error) throw error
  return (data as OrderRow[]).map(mapOrderRow)
}

export async function placeOrder(input: {
  customerId: string
  productId: string
  isPreorder: boolean
  preorderReadyDate: string | null
}) {
  if (!supabase) throw bad('Supabase is not configured')
  const { error } = await supabase.from('orders').insert({
    customer_id: input.customerId,
    product_id: input.productId,
    status: 'PLACED',
    is_preorder: input.isPreorder,
    preorder_ready_date: input.preorderReadyDate,
  })
  if (error) throw error
}

export async function acceptOrder(orderId: string) {
  if (!supabase) throw bad('Supabase is not configured')
  const { error } = await supabase.rpc('accept_order', { p_order_id: orderId })
  if (error) throw error
}

export async function completeCurrentProductionTask(orderId: string) {
  if (!supabase) throw bad('Supabase is not configured')
  const { error } = await supabase.rpc('complete_current_production_task', {
    p_order_id: orderId,
  })
  if (error) throw error
}

export async function fetchCompletedRevenueTodayCents(): Promise<number> {
  if (!supabase) throw bad('Supabase is not configured')
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('orders')
    .select('products ( price_cents )')
    .eq('status', 'READY')
    .gte('completed_at', start.toISOString())
  if (error) throw error
  let sum = 0
  for (const row of data ?? []) {
    const p = normalizeOne(
      (row as { products: { price_cents: number } | { price_cents: number }[] }).products,
    )
    sum += p?.price_cents ?? 0
  }
  return sum
}

export async function fetchOrdersPlacedTodayCount(): Promise<number> {
  if (!supabase) throw bad('Supabase is not configured')
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start.toISOString())
  if (error) throw error
  return count ?? 0
}
