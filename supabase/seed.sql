insert into public.products (slug, title, description, price_cents, in_stock, image_url, sort_order)
values
  (
    'atelier-coat-black',
    'Atelier Coat',
    'Double-faced wool, architectural shoulder. Pre-order flagship.',
    128000,
    false,
    null,
    1
  ),
  (
    'precision-tee-ivory',
    'Precision Tee',
    'Compact jersey, engineered side seam.',
    8900,
    true,
    null,
    2
  ),
  (
    'monolith-trouser',
    'Monolith Trouser',
    'High-twist wool twill, pressed crease.',
    42000,
    true,
    null,
    3
  )
on conflict (slug) do nothing;
