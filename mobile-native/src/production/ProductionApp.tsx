import { useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { completeCurrentProductionTask } from '../lib/api'
import type { RootState } from '../store'
import { logout } from '../store/authSlice'
import { supabase } from '../lib/supabase'
import { colors } from '../theme/theme'
import { typography } from '../theme/typography'
import type { OrderView } from '../types/domain'

function nextOpenTask(o: OrderView) {
  return o.tasks.find((t) => !t.completed) ?? null
}

export function ProductionApp() {
  const dispatch = useDispatch()
  const orders = useSelector((s: RootState) => s.auth.orders)
  const [busy, setBusy] = useState(false)

  const active = useMemo(() => {
    for (const o of orders) {
      const t = nextOpenTask(o)
      if (t) return { order: o, task: t }
    }
    return null
  }, [orders])

  const queue = useMemo(() => {
    return orders.filter((o) => o.tasks.some((t) => !t.completed))
  }, [orders])

  const onComplete = async () => {
    if (!active) return
    setBusy(true)
    try {
      await completeCurrentProductionTask(active.order.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>WORKSHOP</Text>
          <Text style={styles.title}>QUEUE</Text>
        </View>
        <Pressable
          style={styles.outlineBtn}
          onPress={() => {
            dispatch(logout())
            void supabase?.auth.signOut()
          }}
        >
          <Text style={styles.outlineBtnText}>EXIT</Text>
        </Pressable>
      </View>

      {active && (
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>ACTIVE TASK</Text>
          <Text style={styles.heroOrder}>{active.order.productTitle}</Text>
          <Text style={styles.heroStage}>{active.task.label}</Text>
          <Text style={styles.heroHint}>STAGE {active.task.stepIndex} · TAP TO COMPLETE</Text>
          <Pressable style={[styles.bigBtn, busy && styles.bigBtnDisabled]} onPress={() => void onComplete()} disabled={busy}>
            <Text style={styles.bigBtnText}>{busy ? '…' : 'COMPLETE STAGE'}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.listHead}>
        <Text style={styles.listTitle}>SEWING QUEUE</Text>
      </View>
      <FlatList
        data={queue}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const t = nextOpenTask(item)
          return (
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{item.productTitle}</Text>
              <Text style={styles.rowMeta}>{t ? `NEXT · ${t.label}` : '—'}</Text>
            </View>
          )
        }}
        ListEmptyComponent={<Text style={styles.empty}>NO ACTIVE JOBS</Text>}
      />
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
  overline: { ...typography.overline, color: colors.textDim, fontSize: 12, letterSpacing: 3 },
  title: {
    fontFamily: typography.fontBold,
    color: colors.text,
    fontSize: 34,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  outlineBtn: {
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  outlineBtnText: {
    fontFamily: typography.fontBold,
    color: colors.text,
    fontSize: 12,
    letterSpacing: 2,
  },
  hero: {
    margin: 16,
    borderWidth: 2,
    borderColor: colors.text,
    padding: 18,
    backgroundColor: colors.surface,
    gap: 10,
  },
  heroLabel: {
    fontFamily: typography.fontBold,
    color: colors.textDim,
    fontSize: 14,
    letterSpacing: 3,
  },
  heroOrder: {
    fontFamily: typography.fontBold,
    color: colors.text,
    fontSize: 28,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroStage: {
    fontFamily: typography.fontBold,
    color: colors.text,
    fontSize: 44,
    letterSpacing: 2,
  },
  heroHint: { fontFamily: typography.fontRegular, color: colors.textMuted, fontSize: 14 },
  bigBtn: {
    marginTop: 10,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.text,
    paddingVertical: 18,
    alignItems: 'center',
  },
  bigBtnDisabled: { opacity: 0.5 },
  bigBtnText: {
    fontFamily: typography.fontBold,
    color: colors.bg,
    fontSize: 18,
    letterSpacing: 2,
  },
  listHead: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  listTitle: { fontFamily: typography.fontBold, color: colors.text, letterSpacing: 2, fontSize: 14 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  row: { borderWidth: 1, borderColor: colors.line, padding: 14, gap: 6, backgroundColor: colors.surface },
  rowTitle: { fontFamily: typography.fontBold, color: colors.text, fontSize: 16, textTransform: 'uppercase' },
  rowMeta: { fontFamily: typography.fontRegular, color: colors.textMuted, fontSize: 14 },
  empty: { fontFamily: typography.fontBold, color: colors.textDim, fontSize: 16, marginTop: 16 },
})
