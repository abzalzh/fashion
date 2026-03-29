# AVISHU Superapp (Hackathon MVP)

This repository implements the **end-to-end order workflow** for the AVISHU franchise superapp:

1. **Customer** places an order (buy in-stock or pre-order with a ready date).
2. **Franchisee** sees it in near real time and **accepts** it (`PLACED` → `IN_PRODUCTION`).
3. **Production** completes **CUT → SEW → FINISH**; after the last stage the order becomes **`READY`**.
4. **Customer** timeline updates to **Ready** (Supabase realtime on the Expo client; Kotlin client polls).

## Clients in this repo

- **`mobile-native/`**: Expo + React Native + TypeScript (primary demo; Supabase Realtime).
- **`android-native/`**: Kotlin + Jetpack Compose + Hilt + Retrofit (Android Studio).

## Supabase

- **Schema**: `supabase/schema.sql` (strict RLS + RPC transitions).
- **Seed catalog (optional)**: `supabase/seed.sql`.

### Collections

- **`profiles`**: `id` (auth user), `email`, `role` (`customer | franchisee | production`).
- **`products`**: catalog (including `in_stock` flag + optional `image_url`).
- **`orders`**: one line item per checkout in MVP (`customer_id`, `product_id`, `status`, preorder fields, timestamps).
- **`production_tasks`**: ordered steps per order; created when a franchisee acknowledges the order.

### Security model (high level)

- Clients **cannot** freely `UPDATE` orders to cheat statuses — changes go through `accept_order` and `complete_current_production_task`.
- Inserts into `orders` are limited to **customers** creating rows for themselves.

## Run (Expo)

See `TempGuide.txt` for keys and troubleshooting.

```bash
cd mobile-native
cp .env.example .env
# fill EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npx expo start -c
```

## Run (Android Studio / Kotlin)

See `TempGuide.txt`. Open `android-native/` in Android Studio, set `SUPABASE_URL` + `SUPABASE_ANON_KEY` in `local.properties`, then Run.

## Presentation test script (E2E)

1. Seed products (optional): run `supabase/seed.sql`.
2. Register three accounts (metadata role picker in Expo; same in Kotlin):
   - `customer`, `franchisee`, `production`
3. Customer: buy an in-stock item → order appears as **Placed**.
4. Franchisee: accept → **In Production** + tasks appear.
5. Production: tap **Complete stage** three times → **Ready**.
6. Customer: timeline reaches **Ready** without manual reload (Expo realtime).

## Notes

- Image assets are intentionally **placeholders** until you set `products.image_url` or swap in bundled images (see comments in `mobile-native/src/customer/CustomerApp.tsx`).
- `TempGuide.txt` explains where to paste Supabase keys for each client.
