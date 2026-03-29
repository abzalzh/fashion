import { StatusBar } from 'expo-status-bar'
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { LoginScreen } from './src/auth/LoginScreen'
import { loadProfile } from './src/auth/profile'
import { CustomerApp } from './src/customer/CustomerApp'
import { FranchiseeApp } from './src/franchisee/FranchiseeApp'
import { ProductionApp } from './src/production/ProductionApp'
import { startRealtime } from './src/lib/realtime'
import { supabase } from './src/lib/supabase'
import { store, type RootState } from './src/store'
import { loginSuccess, logout, setBootstrapped } from './src/store/authSlice'
import { colors } from './src/theme/theme'

function Shell() {
  const dispatch = useDispatch()
  const { isAuthenticated, bootstrapped, user } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    const client = supabase
    if (!client) {
      dispatch(setBootstrapped(true))
      return
    }

    const { data: subscription } = client.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        let profile = await loadProfile(session.user.id)
        if (!profile) {
          await new Promise((r) => setTimeout(r, 500))
          profile = await loadProfile(session.user.id)
        }
        if (profile) {
          dispatch(loginSuccess(profile))
        } else {
          await client.auth.signOut()
          dispatch(logout())
        }
      } else {
        dispatch(logout())
      }
      dispatch(setBootstrapped(true))
    })

    return () => subscription.subscription.unsubscribe()
  }, [dispatch])

  useEffect(() => {
    const stop = startRealtime(dispatch, user)
    return () => stop()
  }, [dispatch, user])

  if (!bootstrapped) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.text} />
      </View>
    )
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen />
  }

  if (user.role === 'customer') return <CustomerApp />
  if (user.role === 'franchisee') return <FranchiseeApp />
  return <ProductionApp />
}

function AppInner() {
  const [loaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  })

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.text} />
      </View>
    )
  }

  return (
    <>
      <Shell />
      <StatusBar style="light" />
    </>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <AppInner />
    </Provider>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
})
