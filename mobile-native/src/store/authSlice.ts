import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { OrderView } from '../types/domain'
import type { UserProfile } from '../types/roles'

interface AuthState {
  isAuthenticated: boolean
  bootstrapped: boolean
  user: UserProfile | null
  orders: OrderView[]
  realtimeNonce: number
}

const initialState: AuthState = {
  isAuthenticated: false,
  bootstrapped: false,
  user: null,
  orders: [],
  realtimeNonce: 0,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setBootstrapped(state, action: PayloadAction<boolean>) {
      state.bootstrapped = action.payload
    },
    loginSuccess(state, action: PayloadAction<UserProfile>) {
      state.isAuthenticated = true
      state.user = action.payload
    },
    logout(state) {
      state.isAuthenticated = false
      state.user = null
      state.orders = []
      state.realtimeNonce = 0
    },
    setOrders(state, action: PayloadAction<OrderView[]>) {
      state.orders = action.payload
    },
    bumpRealtime(state) {
      state.realtimeNonce += 1
    },
  },
})

export const { setBootstrapped, loginSuccess, logout, setOrders, bumpRealtime } =
  authSlice.actions
export default authSlice.reducer
