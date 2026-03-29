export type OrderStatus = 'PLACED' | 'IN_PRODUCTION' | 'READY'

/** Mirrors spec copy for timeline + badges */
export const ORDER_STATUS_DISPLAY: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  IN_PRODUCTION: 'In Production',
  READY: 'Ready',
}

export interface ProductView {
  id: string
  slug: string
  title: string
  description: string | null
  priceCents: number
  inStock: boolean
  /** PLACEHOLDER until you set CDN URLs in Supabase `products.image_url` */
  imageUrl: string | null
}

export interface ProductionTaskView {
  id: string
  stepIndex: number
  label: string
  completed: boolean
}

export interface OrderView {
  id: string
  status: OrderStatus
  createdAt: string
  productTitle: string
  priceCents: number
  customerEmail?: string
  isPreorder: boolean
  preorderReadyDate: string | null
  tasks: ProductionTaskView[]
}
