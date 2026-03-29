import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { acceptOrder, fetchCompletedRevenueTodayCents, fetchOrdersPlacedTodayCount } from '../lib/api'
import { formatMoney } from '../lib/money'
import { isSupabaseConfigured } from '../lib/supabase'
import type { RootState } from '../store'
import { logout } from '../store/authSlice'
import { supabase } from '../lib/supabase'
import { colors } from '../theme/theme'
import { typography } from '../theme/typography'
import type { OrderView } from '../types/domain'
import { ORDER_STATUS_DISPLAY } from '../types/domain'

type Tab = 'dashboard' | 'pipeline'

export function FranchiseeApp() {
  const dispatch = useDispatch()
  const orders = useSelector((s: RootState) => s.auth.orders)
  const realtimeNonce = useSelector((s: RootState) => s.auth.realtimeNonce)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [revenueToday, setRevenueToday] = useState<number | null>(null)
  const [placedToday, setPlacedToday] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const reloadMetrics = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    try {
      const [rev, placed] = await Promise.all([
        fetchCompletedRevenueTodayCents(),
        fetchOrdersPlacedTodayCount(),
      ])
      setRevenueToday(rev)
      setPlacedToday(placed)
    } catch {
      setRevenueToday(null)
      setPlacedToday(null)
    }
  }, [])

  useEffect(() => {
    void reloadMetrics()
  }, [reloadMetrics, realtimeNonce])

  const columns = useMemo(() => {
    const bucket = (status: OrderView['status']) => orders.filter((o) => o.status === status)
    return {
      placed: bucket('PLACED'),
      active: bucket('IN_PRODUCTION'),
      ready: bucket('READY'),
    }
  }, [orders])

  const planTarget = 10
  const fulfilment =
    placedToday == null ? null : Math.min(100, Math.round((placedToday / planTarget) * 100))

  const onAccept = async (id: string) => {
    setBusyId(id)
    try {
      await acceptOrder(id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>FRANCHISEE · CONTROL TOWER</Text>
          <Text style={styles.title}>OPERATIONS</Text>
        </View>
        <Pressable
          style={styles.outlineBtn}
          onPress={() => {
            dispatch(logout())
            void supabase?.auth.signOut()
          }}
        >
          <Text style={styles.outlineBtnText}>SIGN OUT</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(['dashboard', 'pipeline'] as Tab[]).map((t) => {
          const active = tab === t
          return (
            <Pressable key={t} style={[styles.tab, active && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t === 'dashboard' ? 'ANALYTICS' : 'ORDER PIPELINE'}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {tab === 'dashboard' && (
        <ScrollView contentContainerStyle={styles.dashboard}>
          <Text style={styles.section}>MANAGER · DASHBOARD</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>TODAY&apos;S REVENUE (READY · COMPLETED TODAY)</Text>
              <Text style={styles.metricValue}>
                {revenueToday == null ? '—' : formatMoney(revenueToday)}
              </Text>
              <Text style={styles.metricHint}>REAL DATA FROM SUPABASE</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>PLAN FULFILMENT (ORDERS PLACED · VS TARGET)</Text>
              <Text style={styles.metricValue}>
                {fulfilment == null ? '—' : `${fulfilment}%`}
              </Text>
              <Text style={styles.metricHint}>
                TARGET {planTarget} NEW ORDERS · ACTUAL {placedToday ?? '—'}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>PIPELINE HEALTH (PLACEHOLDER COMPOSITE)</Text>
              <Text style={styles.metricValue}>STABLE</Text>
              <Text style={styles.metricHint}>HOOK FOR FUTURE LEAD TIME / SLA SIGNALS</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {tab === 'pipeline' && (
        <ScrollView horizontal contentContainerStyle={styles.kanban}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>NEW · PLACED</Text>
            {columns.placed.map((o) => (
              <View key={o.id} style={styles.card}>
                <Text style={styles.cardTitle}>{o.productTitle.toUpperCase()}</Text>
                <Text style={styles.cardMeta}>{o.customerEmail ?? o.id.slice(0, 8)}</Text>
                <Text style={styles.cardStatus}>{ORDER_STATUS_DISPLAY[o.status]}</Text>
                <Pressable
                  style={[styles.accept, busyId === o.id && styles.disabled]}
                  onPress={() => void onAccept(o.id)}
                  disabled={busyId === o.id}
                >
                  <Text style={styles.acceptText}>ACCEPT</Text>
                </Pressable>
              </View>
            ))}
            {columns.placed.length === 0 && <Text style={styles.empty}>EMPTY</Text>}
          </View>

          <View style={styles.column}>
            <Text style={styles.columnTitle}>IN PRODUCTION</Text>
            {columns.active.map((o) => (
              <View key={o.id} style={styles.card}>
                <Text style={styles.cardTitle}>{o.productTitle.toUpperCase()}</Text>
                <Text style={styles.cardMeta}>{o.customerEmail ?? o.id.slice(0, 8)}</Text>
                <Text style={styles.cardStatus}>{ORDER_STATUS_DISPLAY[o.status]}</Text>
                <View style={styles.taskList}>
                  {o.tasks.map((t) => (
                    <Text key={t.id} style={styles.taskLine}>
                      {t.label} · {t.completed ? 'DONE' : 'OPEN'}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
            {columns.active.length === 0 && <Text style={styles.empty}>EMPTY</Text>}
          </View>

          <View style={styles.column}>
            <Text style={styles.columnTitle}>READY</Text>
            {columns.ready.map((o) => (
              <View key={o.id} style={styles.cardMuted}>
                <Text style={styles.cardTitle}>{o.productTitle.toUpperCase()}</Text>
                <Text style={styles.cardMeta}>{ORDER_STATUS_DISPLAY[o.status]}</Text>
              </View>
            ))}
            {columns.ready.length === 0 && <Text style={styles.empty}>EMPTY</Text>}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: 48 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overline: { ...typography.overline, color: colors.textDim },
  title: { ...typography.h1, color: colors.text, marginTop: 4 },
  outlineBtn: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 8 },
  outlineBtnText: { ...typography.caption, color: colors.text },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { backgroundColor: colors.text },
  tabText: { ...typography.caption, color: colors.textMuted },
  tabTextActive: { color: colors.bg },
  dashboard: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { ...typography.h2, color: colors.text },
  metricGrid: { gap: 10 },
  metric: { borderWidth: 1, borderColor: colors.line, padding: 14, backgroundColor: colors.surface, gap: 6 },
  metricLabel: { ...typography.caption, color: colors.textMuted },
  metricHint: { ...typography.micro, color: colors.textDim },
  metricValue: { ...typography.h1, color: colors.text, marginTop: 4 },
  kanban: { padding: 16, gap: 12, alignItems: 'flex-start' },
  column: {
    width: 260,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    backgroundColor: colors.bg,
    marginRight: 12,
  },
  columnTitle: { ...typography.h2, color: colors.text, marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.surface,
    gap: 6,
  },
  cardMuted: {
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.surface2,
    gap: 6,
    opacity: 0.85,
  },
  cardTitle: { ...typography.caption, color: colors.text },
  cardMeta: { ...typography.micro, color: colors.textMuted },
  cardStatus: { ...typography.micro, color: colors.text },
  accept: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.text,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptText: { ...typography.caption, color: colors.bg },
  disabled: { opacity: 0.5 },
  taskList: { marginTop: 6, gap: 4 },
  taskLine: { ...typography.micro, color: colors.textMuted },
  empty: { ...typography.micro, color: colors.textDim },
})
