import { configureStore } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: { auth: authReducer },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAuth = () => useSelector((state: RootState) => state.auth)
