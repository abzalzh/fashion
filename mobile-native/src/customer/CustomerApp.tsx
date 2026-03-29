import { useCallback, useEffect, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts, placeOrder } from '../lib/api'
import { formatMoney } from '../lib/money'
import { isSupabaseConfigured } from '../lib/supabase'
import type { RootState } from '../store'
import { colors } from '../theme/theme'
import { typography } from '../theme/typography'
import type { ProductView } from '../types/domain'
import { ORDER_STATUS_DISPLAY } from '../types/domain'
import { CartTab } from './CartTab'
import { SupportTab } from './SupportTab'

function chunkCatalog<T>(items: T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size))
  return rows
}
import { logout } from '../store/authSlice'
import { supabase } from '../lib/supabase'

type Tab = 'store' | 'cart' | 'support' | 'orders'

export function CustomerApp() {
  const dispatch = useDispatch()
  const user = useSelector((s: RootState) => s.auth.user)
  const orders = useSelector((s: RootState) => s.auth.orders)
  const realtimeNonce = useSelector((s: RootState) => s.auth.realtimeNonce)
  const [tab, setTab] = useState<Tab>('store')
  const [products, setProducts] = useState<ProductView[]>([])
  const [product, setProduct] = useState<ProductView | null>(null)
  const [preorderDate, setPreorderDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [buyBusy, setBuyBusy] = useState(false)
  const [buyMessage, setBuyMessage] = useState<string | null>(null)

  const reloadProducts = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    try {
      setProducts(await fetchProducts())
    } catch {
      setProducts([])
    }
  }, [])

  useEffect(() => {
    void reloadProducts()
  }, [reloadProducts, realtimeNonce])

  const onBuy = async () => {
    if (!user || !product) return
    setBuyMessage(null)
    setBuyBusy(true)
    try {
      if (!product.inStock) {
        await placeOrder({
          customerId: user.id,
          productId: product.id,
          isPreorder: true,
          preorderReadyDate: preorderDate.toISOString().slice(0, 10),
        })
      } else {
        await placeOrder({
          customerId: user.id,
          productId: product.id,
          isPreorder: false,
          preorderReadyDate: null,
        })
      }
      setProduct(null)
      setTab('orders')
    } catch (e) {
      setBuyMessage(e instanceof Error ? e.message : 'ORDER FAILED')
    } finally {
      setBuyBusy(false)
    }
  }

  const loyaltyProgress = Math.min(100, Math.max(0, orders.filter((o) => o.status === 'READY').length * 25))

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>CUSTOMER · STOREFRONT</Text>
          <Text style={styles.title}>AVISHU</Text>
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

      {!isSupabaseConfigured() && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>ADD SUPABASE KEYS IN mobile-native/.env</Text>
        </View>
      )}

      <View style={styles.tabs}>
        {(['store', 'cart', 'support', 'orders'] as Tab[]).map((t) => {
          const active = tab === t
          return (
            <Pressable key={t} style={[styles.tab, active && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t === 'store' ? 'CATALOG' : 
                 t === 'cart' ? 'CART' : 
                 t === 'support' ? 'SUPPORT' : 
                 'PROFILE · ORDERS'}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {tab === 'store' && (
        <ScrollView contentContainerStyle={styles.storeScroll}>
          <View style={styles.bannerHero}>
            <Text style={styles.heroKicker}>COLLECTION 01</Text>
            <Text style={styles.heroTitle}>MONOLITH LINE</Text>
            <Text style={styles.heroBody}>Editorial spacing. No gradients. Structure over noise.</Text>
          </View>

          <Text style={styles.sectionLabel}>PRODUCTS</Text>
          {chunkCatalog(products, 2).map((row) => (
            <View key={row.map((r) => r.id).join('-')} style={styles.gridRow}>
              {row.map((item) => (
                <Pressable key={item.id} style={styles.tile} onPress={() => setProduct(item)}>
                  <View style={styles.imageBox}>
                    {/* PLACEHOLDER: set products.image_url in Supabase or swap for <Image source={require('...')} /> */}
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.image} />
                    ) : (
                      <Text style={styles.imagePlaceholder}>IMAGE PLACEHOLDER{'\n'}(SET URL IN DB)</Text>
                    )}
                  </View>
                  <Text style={styles.tileTitle}>{item.title.toUpperCase()}</Text>
                  <Text style={styles.tileMeta}>{item.inStock ? 'IN STOCK' : 'PRE-ORDER'}</Text>
                  <Text style={styles.tilePrice}>{formatMoney(item.priceCents)} MRP</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {tab === 'cart' && <CartTab />}

      {tab === 'support' && <SupportTab />}

      {tab === 'orders' && (
        <ScrollView contentContainerStyle={styles.ordersScroll}>
          <Text style={styles.sectionLabel}>LOYALTY (UI ONLY)</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${loyaltyProgress}%` }]} />
          </View>
          <Text style={styles.progressCaption}>{loyaltyProgress}% TOWARD NEXT TIER</Text>

          <Text style={[styles.sectionLabel, { marginTop: 18 }]}>ACTIVE ORDERS</Text>
          {orders.length === 0 && <Text style={styles.empty}>NO ORDERS YET</Text>}
          {orders.map((o) => (
            <View key={o.id} style={styles.orderCard}>
              <View style={styles.orderTop}>
                <Text style={styles.orderTitle}>{o.productTitle.toUpperCase()}</Text>
                <Text style={styles.orderIdSmall}>{o.id.slice(0, 8).toUpperCase()}</Text>
              </View>
              <View style={styles.timeline}>
                {(['PLACED', 'IN_PRODUCTION', 'READY'] as const).map((st, idx) => {
                  const activeIdx =
                    o.status === 'PLACED' ? 0 : o.status === 'IN_PRODUCTION' ? 1 : 2
                  const lit = idx <= activeIdx
                  return (
                    <View key={st} style={styles.step}>
                      <View style={[styles.dot, lit && styles.dotLit]} />
                      <Text style={[styles.stepLabel, lit && styles.stepLabelLit]}>
                        {ORDER_STATUS_DISPLAY[st]}
                      </Text>
                    </View>
                  )
                })}
              </View>
              {o.isPreorder && (
                <Text style={styles.preorderHint}>
                  PRE-ORDER · READY DATE {o.preorderReadyDate ?? 'TBD'}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={product != null} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {product && (
              <>
                <Text style={styles.modalKicker}>{product.inStock ? 'IN STOCK' : 'PRE-ORDER'}</Text>
                <Text style={styles.modalTitle}>{product.title.toUpperCase()}</Text>
                <Text style={styles.modalPrice}>{formatMoney(product.priceCents)} MRP</Text>
                <Text style={styles.modalBody}>{product.description ?? '—'}</Text>

                {!product.inStock && (
                  <>
                    <Text style={styles.modalLabel}>READY DATE</Text>
                    <Pressable style={styles.dateBtn} onPress={() => setPickerOpen(true)}>
                      <Text style={styles.dateBtnText}>{preorderDate.toDateString()}</Text>
                    </Pressable>
                    {pickerOpen && (
                      <DateTimePicker
                        value={preorderDate}
                        mode="date"
                        display="default"
                        minimumDate={new Date()}
                        onChange={(e: DateTimePickerEvent, d?: Date) => {
                          setPickerOpen(false)
                          if (e.type === 'set' && d) setPreorderDate(d)
                        }}
                      />
                    )}
                  </>
                )}

                {buyMessage && <Text style={styles.error}>{buyMessage}</Text>}

                <View style={styles.modalActions}>
                  <Pressable style={styles.ghost} onPress={() => setProduct(null)}>
                    <Text style={styles.ghostText}>CLOSE</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primary, buyBusy && styles.disabled]}
                    onPress={() => void onBuy()}
                    disabled={buyBusy}
                  >
                    <Text style={styles.primaryText}>
                      {product.inStock ? 'BUY NOW' : 'PLACE PRE-ORDER'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overline: { ...typography.overline, color: colors.textDim },
  title: { ...typography.h1, color: colors.text, marginTop: 4 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  outlineBtnText: { ...typography.caption, color: colors.text },
  banner: { borderBottomWidth: 1, borderBottomColor: colors.line, padding: 10, backgroundColor: colors.surface },
  bannerText: { ...typography.micro, color: colors.textMuted },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { backgroundColor: colors.text },
  tabText: { ...typography.caption, color: colors.textMuted },
  tabTextActive: { color: colors.bg },
  storeScroll: { padding: 16, paddingBottom: 32, gap: 10 },
  bannerHero: {
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    backgroundColor: colors.surface,
    gap: 6,
  },
  heroKicker: { ...typography.overline, color: colors.textDim },
  heroTitle: { ...typography.h1, color: colors.text },
  heroBody: { ...typography.body, color: colors.textMuted },
  sectionLabel: { ...typography.h2, color: colors.text, marginTop: 6 },
  gridRow: { gap: 10, marginBottom: 10 },
  tile: { flex: 1, borderWidth: 1, borderColor: colors.line, padding: 10, backgroundColor: colors.bg },
  imageBox: {
    height: 140,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    ...typography.micro,
    color: colors.textDim,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  tileTitle: { ...typography.caption, color: colors.text },
  tileMeta: { ...typography.micro, color: colors.textMuted, marginTop: 4 },
  tilePrice: { ...typography.micro, color: colors.text, marginTop: 4 },
  ordersScroll: { padding: 16, paddingBottom: 40, gap: 12 },
  progressTrack: {
    height: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  progressFill: { height: '100%', backgroundColor: colors.text },
  progressCaption: { ...typography.micro, color: colors.textMuted, marginTop: 6 },
  empty: { ...typography.body, color: colors.textMuted, marginTop: 8 },
  orderCard: { borderWidth: 1, borderColor: colors.line, padding: 14, gap: 10, backgroundColor: colors.bg },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  orderTitle: { ...typography.caption, color: colors.text, flex: 1 },
  orderIdSmall: { ...typography.micro, color: colors.textDim },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  step: { alignItems: 'center', flex: 1, gap: 6 },
  dot: { width: 10, height: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg },
  dotLit: { backgroundColor: colors.text },
  stepLabel: { ...typography.micro, color: colors.textDim, textAlign: 'center' },
  stepLabelLit: { color: colors.text },
  preorderHint: { ...typography.micro, color: colors.textMuted },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg, padding: 16, gap: 10 },
  modalKicker: { ...typography.overline, color: colors.textDim },
  modalTitle: { ...typography.h1, color: colors.text },
  modalPrice: { ...typography.caption, color: colors.textMuted },
  modalBody: { ...typography.body, color: colors.textMuted },
  modalLabel: { ...typography.caption, color: colors.textMuted },
  dateBtn: { borderWidth: 1, borderColor: colors.line, padding: 12 },
  dateBtnText: { ...typography.body, color: colors.text },
  error: { ...typography.caption, color: colors.text },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  ghost: { flex: 1, borderWidth: 1, borderColor: colors.line, padding: 12, alignItems: 'center' },
  ghostText: { ...typography.caption, color: colors.text },
  primary: { flex: 1, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.text, padding: 12, alignItems: 'center' },
  primaryText: { ...typography.caption, color: colors.bg },
  disabled: { opacity: 0.5 },
})
