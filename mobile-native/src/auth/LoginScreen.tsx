import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { supabase } from '../lib/supabase'
import { colors } from '../theme/theme'
import type { UserProfile, UserRole } from '../types/roles'
import { typography } from '../theme/typography'
import { loginSuccess } from '../store/authSlice'
import { loadProfile } from './profile'

type Mode = 'sign_in' | 'register'

const roles: UserRole[] = ['customer', 'franchisee', 'production']

export function LoginScreen() {
  const dispatch = useDispatch()
  const [mode, setMode] = useState<Mode>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registerRole, setRegisterRole] = useState<UserRole>('customer')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const canSubmit = useMemo(() => email.includes('@') && password.length >= 6, [email, password])

  const submit = async () => {
    setMessage(null)
    if (!supabase) {
      setMessage('Supabase is not configured. Add keys in mobile-native/.env')
      return
    }
    if (!canSubmit) {
      setMessage('Use a valid email and a password with at least 6 characters.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { role: registerRole } },
        })
        if (error) throw error
        if (!data.session) {
          setMessage(
            'Check your inbox to confirm the account (or disable email confirmations in Supabase for hackathon demos).',
          )
          return
        }
        const profile = await loadProfile(data.session.user.id)
        if (profile) dispatch(loginSuccess(profile))
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      const profile = await loadProfile(data.user.id)
      if (!profile) {
        setMessage('Profile row missing. Re-run supabase/schema.sql + sign up again.')
        return
      }
      dispatch(loginSuccess(profile))
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.overline}>AVISHU</Text>
        <Text style={styles.title}>UNIFIED ACCESS</Text>
        <Text style={styles.muted}>Single entry routes by role after authentication.</Text>

        <View style={styles.segment}>
          {(['sign_in', 'register'] as Mode[]).map((m) => {
            const active = mode === m
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {m === 'sign_in' ? 'SIGN IN' : 'REGISTER'}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <TextInput
          style={styles.input}
          placeholder="EMAIL"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="PASSWORD"
          placeholderTextColor={colors.textDim}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {mode === 'register' && (
          <>
            <Text style={styles.label}>ROLE (METADATA)</Text>
            <View style={styles.wrap}>
              {roles.map((r) => {
                const active = registerRole === r
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRegisterRole(r)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{r}</Text>
                  </Pressable>
                )
              })}
            </View>
            <Text style={styles.hint}>
              For production deployments, restrict franchisee/production signup to admins only. This
              demo uses user metadata for speed.
            </Text>
          </>
        )}

        {message && <Text style={styles.message}>{message}</Text>}

        <Pressable
          style={[styles.submit, (!canSubmit || busy) && styles.submitDisabled]}
          onPress={() => void submit()}
          disabled={!canSubmit || busy}
        >
          <Text style={styles.submitText}>{busy ? 'PLEASE WAIT' : 'CONTINUE'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 12,
    backgroundColor: colors.bg,
  },
  overline: {
    ...typography.overline,
    color: colors.textDim,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  muted: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 4,
  },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.line,
  },
  segmentItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentItemActive: { backgroundColor: colors.text },
  segmentText: { ...typography.caption, color: colors.textMuted },
  segmentTextActive: { color: colors.bg },
  label: { ...typography.caption, color: colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: typography.fontRegular,
  },
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pillActive: { backgroundColor: colors.text },
  pillText: { ...typography.caption, color: colors.textMuted },
  pillTextActive: { color: colors.bg },
  hint: {
    ...typography.micro,
    color: colors.textDim,
    lineHeight: 16,
  },
  message: { ...typography.caption, color: colors.text },
  submit: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.text,
    padding: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { ...typography.caption, color: colors.bg, letterSpacing: 1.2 },
})
