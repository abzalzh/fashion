import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native'
import { WebView } from 'react-native-webview'
import { colors } from '../theme/theme'
import { typography } from '../theme/typography'
import { MaterialIcons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'

const { width, height } = Dimensions.get('window')

interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
  imageUrl?: string
  modelPath?: string
  modelBase64?: string
  fabricComposition?: string
  volumeLiters?: number
  estimatedProductionDays?: number
}

const GLB_MODELS_BASE64: Record<string, string> = {}

export async function loadGLBModels() {
  try {
    const models = await import('../models/glbModels')
    if (models && (models as any).GLB_MODELS) {
      Object.assign(GLB_MODELS_BASE64, (models as any).GLB_MODELS)
    }
  } catch (e) {
    console.log('GLB models not preloaded')
  }
}

export function CartTab() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null)
  const [is3DModalVisible, setIs3DModalVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasGLBModels, setHasGLBModels] = useState(false)
  const webViewRef = useRef<WebView>(null)

  useEffect(() => {
    const initializeCart = async () => {
      setIsLoading(true)
      try {
        await loadGLBModels()
        setHasGLBModels(Object.keys(GLB_MODELS_BASE64).length > 0)

        if (!supabase) {
          setCartItems(getDemoItems())
          return
        }

        const { data: products, error } = await supabase
          .from('products')
          .select('id, slug, title, description, price_cents, in_stock, image_url, fabric_composition, volume_liters, estimated_production_days')
          .limit(10)

        if (error || !products || products.length === 0) {
          setCartItems(getDemoItems())
        } else {
          const items: CartItem[] = products.slice(0, 3).map((p: any) => ({
            id: p.id,
            title: p.title || p.slug?.toUpperCase() || 'PRODUCT',
            price: p.price_cents || 0,
            quantity: 1,
            imageUrl: p.image_url,
            modelPath: p.slug,
            modelBase64: GLB_MODELS_BASE64[p.slug] || GLB_MODELS_BASE64['jacket'],
            fabricComposition: p.fabric_composition,
            volumeLiters: p.volume_liters,
            estimatedProductionDays: p.estimated_production_days,
          }))
          setCartItems(items)
        }
      } catch (e) {
        setCartItems(getDemoItems())
      } finally {
        setIsLoading(false)
      }
    }
    initializeCart()
  }, [])

  const getDemoItems = (): CartItem[] => [
    {
      id: '1',
      title: 'MONOLITH JACKET',
      price: 29900,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=200&fit=crop',
      modelPath: 'jacket',
      modelBase64: GLB_MODELS_BASE64['jacket'],
      fabricComposition: '100% Organic Cotton Canvas',
      volumeLiters: 2.5,
      estimatedProductionDays: 3,
    },
    {
      id: '2',
      title: 'STRUCTURE JEANS',
      price: 18900,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=200&h=200&fit=crop',
      modelPath: 'jeans',
      modelBase64: GLB_MODELS_BASE64['jeans'],
      fabricComposition: '98% Cotton, 2% Elastane',
      volumeLiters: 1.8,
      estimatedProductionDays: 4,
    },
  ]

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getItemTotal = (item: CartItem) => {
    return item.price * item.quantity
  }

  const open3DPreview = (item: CartItem) => {
    if (!item.modelBase64 && !hasGLBModels) {
      Alert.alert('3D Preview', '3D model not available for this item.')
      return
    }
    setSelectedItem(item)
    setIs3DModalVisible(true)
  }

  const close3DPreview = () => {
    setIs3DModalVisible(false)
    setSelectedItem(null)
  }

  const render3DViewerHTML = useCallback(() => {
    if (!selectedItem?.modelBase64) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <style>
            body { margin: 0; overflow: hidden; background-color: #000; }
            canvas { display: block; }
            .loading { color: #fff; font-family: sans-serif; text-align: center; padding-top: 50%; }
          </style>
        </head>
        <body>
          <div class="loading" id="loading">Loading 3D Model...</div>
          <script type="importmap">
            {
              "imports": {
                "three": "https://unpkg.com/three@0.145.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.145.0/examples/jsm/"
              }
            }
          </script>
          <script type="module">
            import * as THREE from 'three';
            import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x111111);

            const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 0, 5);

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            document.body.appendChild(renderer.domElement);

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            const geometry = new THREE.BoxGeometry(2, 2.5, 0.5);
            const material = new THREE.MeshStandardMaterial({ 
              color: 0x333333,
              roughness: 0.7,
              metalness: 0.1
            });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);

            const edges = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
            const wireframe = new THREE.LineSegments(edges, lineMaterial);
            cube.add(wireframe);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            scene.add(ambientLight);

            const dirLight = new THREE.DirectionalLight(0xffffff, 1);
            dirLight.position.set(5, 10, 7.5);
            scene.add(dirLight);

            const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
            dirLight2.position.set(-5, -10, -7.5);
            scene.add(dirLight2);

            document.getElementById('loading').style.display = 'none';

            function animate() {
              requestAnimationFrame(animate);
              cube.rotation.y += 0.005;
              controls.update();
              renderer.render(scene, camera);
            }
            animate();

            window.addEventListener('resize', () => {
              camera.aspect = window.innerWidth / window.innerHeight;
              camera.updateProjectionMatrix();
              renderer.setSize(window.innerWidth, window.innerHeight);
            });
          </script>
        </body>
        </html>
      `
    }

    const modelDataUri = `data:model/gltf-binary;base64,${selectedItem.modelBase64}`

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <style>
          body { margin: 0; overflow: hidden; background-color: #000; }
          canvas { display: block; }
          .loading { color: #fff; font-family: sans-serif; text-align: center; padding-top: 50%; }
        </style>
      </head>
      <body>
        <div class="loading" id="loading">Loading 3D Model...</div>
        <script type="importmap">
          {
            "imports": {
              "three": "https://unpkg.com/three@0.145.0/build/three.module.js",
              "three/addons/": "https://unpkg.com/three@0.145.0/examples/jsm/"
            }
          }
        </script>
        <script type="module">
          import * as THREE from 'three';
          import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
          import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

          const scene = new THREE.Scene();
          scene.background = new THREE.Color(0x111111);

          const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.set(0, 1.5, 3);

          const renderer = new THREE.WebGLRenderer({ antialias: true });
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setPixelRatio(window.devicePixelRatio);
          document.body.appendChild(renderer.domElement);

          const controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
          controls.minDistance = 1;
          controls.maxDistance = 10;

          const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
          scene.add(ambientLight);

          const dirLight = new THREE.DirectionalLight(0xffffff, 1);
          dirLight.position.set(5, 10, 7.5);
          scene.add(dirLight);

          const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
          dirLight2.position.set(-5, -10, -7.5);
          scene.add(dirLight2);

          const loader = new GLTFLoader();
          loader.load(
            '${modelDataUri}',
            (gltf) => {
              const model = gltf.scene;
              scene.add(model);
              
              const box = new THREE.Box3().setFromObject(model);
              const center = box.getCenter(new THREE.Vector3());
              model.position.x -= center.x;
              model.position.y -= center.y;
              model.position.z -= center.z;
              
              const size = box.getSize(new THREE.Vector3()).length();
              const scale = 2 / size;
              model.scale.set(scale, scale, scale);
              
              document.getElementById('loading').style.display = 'none';
            },
            undefined,
            (error) => {
              console.error('Error loading model:', error);
              document.getElementById('loading').textContent = 'Error loading model';
            }
          );

          function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
          }
          animate();

          window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
          });
        </script>
      </body>
      </html>
    `
  }, [selectedItem])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    )
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="shopping-cart" size={80} color={colors.textDim} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add items from the catalog to get started</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>CART</Text>

        {cartItems.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemImageContainer}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
              ) : (
                <View style={styles.itemImagePlaceholder}>
                  <MaterialIcons name="image" size={32} color={colors.textDim} />
                </View>
              )}
            </View>

            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{item.title.toUpperCase()}</Text>

              <View style={styles.priceContainer}>
                <Text style={styles.itemPricePerUnit}>₹{(item.price / 100).toLocaleString()} each</Text>
                {item.quantity > 1 && (
                  <Text style={styles.itemPriceTotal}>
                    ₹{(getItemTotal(item) / 100).toLocaleString()} total
                  </Text>
                )}
              </View>

              {item.fabricComposition && (
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Fabric: </Text>
                  {item.fabricComposition}
                </Text>
              )}

              {item.volumeLiters !== undefined && item.volumeLiters !== null && (
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Volume: </Text>
                  {item.volumeLiters} L
                </Text>
              )}

              {item.estimatedProductionDays !== undefined && item.estimatedProductionDays !== null && (
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Production: </Text>
                  {item.estimatedProductionDays} days
                </Text>
              )}

              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Text style={styles.quantityBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Text style={styles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.itemActions}>
              <TouchableOpacity style={styles.previewBtn} onPress={() => open3DPreview(item)}>
                <MaterialIcons name="view-in-ar" size={20} color={colors.text} />
                <Text style={styles.previewBtnText}>3D</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id)}>
                <MaterialIcons name="delete" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalAmount}>₹{(getTotalPrice() / 100).toLocaleString()}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutBtn}>
          <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={is3DModalVisible} transparent={false} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeBtn} onPress={close3DPreview}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedItem?.title.toUpperCase()} - 3D PREVIEW</Text>
          </View>

          {selectedItem && (
            <WebView
              ref={webViewRef}
              source={{ html: render3DViewerHTML() }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              originWhitelist={['*']}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
            />
          )}
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textDim,
    marginTop: 16,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  itemImageContainer: {
    width: 100,
    height: 120,
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  itemTitle: {
    ...typography.caption,
    color: colors.text,
    marginBottom: 4,
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemPricePerUnit: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginRight: 8,
  },
  itemPriceTotal: {
    ...typography.micro,
    color: colors.textDim,
  },
  detailText: {
    ...typography.micro,
    color: colors.text,
    marginBottom: 2,
  },
  detailLabel: {
    color: colors.textDim,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityBtn: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnText: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
  },
  quantityText: {
    ...typography.body,
    color: colors.text,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  itemActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    borderRadius: 4,
  },
  previewBtnText: {
    ...typography.micro,
    color: colors.text,
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    ...typography.micro,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  totalAmount: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  checkoutBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
  },
  checkoutBtnText: {
    ...typography.caption,
    color: colors.bg,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.bg,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textDim,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.bg,
  },
  closeBtn: {
    padding: 8,
    marginRight: 12,
  },
  modalTitle: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  webView: {
    flex: 1,
  },
})
