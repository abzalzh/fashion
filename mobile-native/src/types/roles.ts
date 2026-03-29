export type UserRole = 'customer' | 'franchisee' | 'production'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  displayName: string | null
}
