-- ============================================================
-- DATOS DEMO - Aticama Mariscos Nayarit
-- Ejecutar en el SQL Editor de Supabase después de todas las fases
-- ============================================================

-- Evitar duplicados al re-correr el script
DELETE FROM public.ruta_clientes;
DELETE FROM public.rutas;
DELETE FROM public.clientes;
DELETE FROM public.receta_insumos;
DELETE FROM public.recetas;
DELETE FROM public.productos;
DELETE FROM public.marcas;
DELETE FROM public.insumos;

-- ─── INSUMOS (Materias primas) ───────────────────────────────
INSERT INTO public.insumos (nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario) VALUES
  ('Camarón fresco mediano',  'KG',   85.5,  20,  180.00),
  ('Camarón cristal seco',    'KG',   42.0,  15,  320.00),
  ('Pulpo cocido',            'KG',    8.0,  10,  210.00),
  ('Calamar limpio',          'KG',   25.0,   8,   95.00),
  ('Jaiba limpia',            'KG',   18.0,   5,  160.00),
  ('Chile ancho seco',        'KG',   12.0,   3,   90.00),
  ('Chile mulato',            'KG',    8.5,   2,   95.00),
  ('Ajo pelado',              'KG',   15.0,   5,   55.00),
  ('Cebolla blanca',          'KG',   40.0,  10,   18.00),
  ('Jitomate',                'KG',   50.0,  15,   22.00),
  ('Limón sin semilla',       'KG',   35.0,  10,   28.00),
  ('Vinagre blanco',          'LT',   20.0,   5,   30.00),
  ('Aceite vegetal',          'LT',   30.0,  10,   45.00),
  ('Sal de mar',              'KG',   25.0,   5,    8.00),
  ('Orégano seco',            'KG',    3.5,   1,  120.00),
  ('Comino molido',           'KG',    2.0,   1,  140.00),
  ('Clavo de olor',           'KG',    1.0, 0.5,  180.00),
  ('Pimienta negra',          'KG',    1.5,   1,  150.00),
  ('Guajillo seco',           'KG',    9.0,   3,   85.00),
  ('Botella PET 500ml',       'PZA', 500.0, 100,    3.50),
  ('Botella PET 1L',          'PZA', 300.0,  80,    4.80),
  ('Caja cartón 12u',         'PZA', 120.0,  30,   18.00),
  ('Etiqueta adhesiva',       'PZA', 800.0, 200,    0.80),
  ('Film stretch',            'ROL',   8.0,   2,   95.00);

-- ─── MARCAS ──────────────────────────────────────────────────
INSERT INTO public.marcas (nombre) VALUES
  ('Aticama Premium'),
  ('Mariscos del Pacífico'),
  ('Nayarit Gourmet');

-- ─── PRODUCTOS ───────────────────────────────────────────────
INSERT INTO public.productos (marca_id, nombre, codigo_barras, precio_venta, stock_actual, stock_minimo) VALUES
  ((SELECT id FROM public.marcas WHERE nombre = 'Aticama Premium'),
   'Salsa de Camarón 500ml', '7501234560010', 65.00, 144, 30),
  ((SELECT id FROM public.marcas WHERE nombre = 'Aticama Premium'),
   'Salsa de Camarón 1L', '7501234560027', 115.00, 96, 20),
  ((SELECT id FROM public.marcas WHERE nombre = 'Aticama Premium'),
   'Salsa de Chiltepin', '7501234560034', 55.00, 120, 24),
  ((SELECT id FROM public.marcas WHERE nombre = 'Aticama Premium'),
   'Caldo de Mariscos 1L', '7501234560041', 130.00, 60, 15),
  ((SELECT id FROM public.marcas WHERE nombre = 'Mariscos del Pacífico'),
   'Camarón enchilado 250g', '7509876540018', 85.00, 72, 18),
  ((SELECT id FROM public.marcas WHERE nombre = 'Mariscos del Pacífico'),
   'Botana de Pulpo en escabeche 500ml', '7509876540025', 95.00, 48, 10),
  ((SELECT id FROM public.marcas WHERE nombre = 'Mariscos del Pacífico'),
   'Jaiba preparada al chipote 300g', '7509876540032', 78.00, 36, 8),
  ((SELECT id FROM public.marcas WHERE nombre = 'Nayarit Gourmet'),
   'Crema de camarón 400ml', '7506543210015', 145.00, 24, 6),
  ((SELECT id FROM public.marcas WHERE nombre = 'Nayarit Gourmet'),
   'Ceviche deshidratado mixto 200g', '7506543210022', 110.00, 30, 8),
  ((SELECT id FROM public.marcas WHERE nombre = 'Nayarit Gourmet'),
   'Mole de camarón negro 350g', '7506543210039', 125.00, 18, 5);

-- ─── RECETA 1: Salsa de Camarón 500ml ────────────────────────
WITH r1 AS (
  INSERT INTO public.recetas (producto_id, nombre, descripcion, rendimiento)
  VALUES (
    (SELECT id FROM public.productos WHERE codigo_barras = '7501234560010'),
    'Salsa Camarón 500ml – Lote 12 botellas',
    'Cocción 2h, molienda fina, envasado en caliente. Proceso artesanal certificado.',
    12
  ) RETURNING id
)
INSERT INTO public.receta_insumos (receta_id, insumo_id, cantidad_requerida)
SELECT r1.id, i.id,
  CASE i.nombre
    WHEN 'Camarón fresco mediano' THEN 2.5
    WHEN 'Chile ancho seco'       THEN 0.3
    WHEN 'Ajo pelado'             THEN 0.2
    WHEN 'Cebolla blanca'         THEN 0.5
    WHEN 'Vinagre blanco'         THEN 0.5
    WHEN 'Sal de mar'             THEN 0.1
    WHEN 'Botella PET 500ml'      THEN 12
    WHEN 'Etiqueta adhesiva'      THEN 12
  END
FROM r1, public.insumos i
WHERE i.nombre IN ('Camarón fresco mediano','Chile ancho seco','Ajo pelado','Cebolla blanca','Vinagre blanco','Sal de mar','Botella PET 500ml','Etiqueta adhesiva');

-- ─── RECETA 2: Caldo de Mariscos 1L ──────────────────────────
WITH r2 AS (
  INSERT INTO public.recetas (producto_id, nombre, descripcion, rendimiento)
  VALUES (
    (SELECT id FROM public.productos WHERE codigo_barras = '7501234560041'),
    'Caldo Mariscos 1L – Lote 8 botellas',
    'Cocción lenta 4h con mariscos frescos y especias seleccionadas de Nayarit.',
    8
  ) RETURNING id
)
INSERT INTO public.receta_insumos (receta_id, insumo_id, cantidad_requerida)
SELECT r2.id, i.id,
  CASE i.nombre
    WHEN 'Camarón fresco mediano' THEN 1.5
    WHEN 'Pulpo cocido'           THEN 1.0
    WHEN 'Calamar limpio'         THEN 0.8
    WHEN 'Jitomate'               THEN 1.2
    WHEN 'Cebolla blanca'         THEN 0.6
    WHEN 'Ajo pelado'             THEN 0.15
    WHEN 'Orégano seco'           THEN 0.05
    WHEN 'Pimienta negra'         THEN 0.03
    WHEN 'Sal de mar'             THEN 0.12
    WHEN 'Botella PET 1L'         THEN 8
    WHEN 'Etiqueta adhesiva'      THEN 8
  END
FROM r2, public.insumos i
WHERE i.nombre IN ('Camarón fresco mediano','Pulpo cocido','Calamar limpio','Jitomate','Cebolla blanca','Ajo pelado','Orégano seco','Pimienta negra','Sal de mar','Botella PET 1L','Etiqueta adhesiva');

-- ─── CLIENTES ────────────────────────────────────────────────
INSERT INTO public.clientes (nombre, direccion, telefono, requiere_factura, rfc, razon_social) VALUES
  ('Marisquería El Farol',        'Av. Insurgentes 245, Col. Centro, Tepic',      '311-234-5678', false, null, null),
  ('Taquería Los Compadres',      'Calle Hidalgo 78, Xalisco, Nayarit',           '311-345-6789', false, null, null),
  ('Restaurant El Rincón Marino', 'Blvd. Francisco Villa 1200, Tepic',            '311-456-7890', true,  'RIVF890321AG5', 'Rincón Marino S.A. de C.V.'),
  ('Mariscos La Playa',           'Paseo de la Marina s/n, San Blas, Nayarit',   '323-100-2233', false, null, null),
  ('Cocina Don Chava',            'Mercado Municipal, Local 34, Compostela',      '312-567-8901', false, null, null),
  ('Pescadería y Mariscos Lety',  'Av. Allende 560, Tepic',                       '311-678-9012', false, null, null),
  ('Sabor a Mar Restaurant',      'Malecón Norte 890, Mazatlán, Sin.',            '669-234-5678', true,  'SAML950615HJ4', 'Sabor a Mar S.A. de C.V.'),
  ('Cenaduría La Güera',          'Col. Menchaca, Calle Juchitán 23, Tepic',     '311-789-0123', false, null, null),
  ('Hotel Boutique Nayar',        'Av. México 450, Nuevo Vallarta, Nayarit',     '322-100-4455', true,  'HBNX010510KQ2', 'Grupo Hotelero Nayar S.C.'),
  ('Mariscos El Camarón Gigante', 'Carretera a Compostela km 3.5',                '312-890-1234', false, null, null),
  ('Lonchería Doña Cuca',         'Mercado Emiliano Zapata, Local 12, Tepic',    '311-901-2345', false, null, null),
  ('Camaronería El Pacífico',     'Fracc. Las Palmas, Tepic',                     '311-012-3456', false, null, null);

-- ─── RUTAS ───────────────────────────────────────────────────
INSERT INTO public.rutas (nombre) VALUES
  ('Ruta Tepic Centro'),
  ('Ruta Tepic Norte'),
  ('Ruta San Blas – Compostela'),
  ('Ruta Nuevo Vallarta');

-- ─── CLIENTES POR RUTA ───────────────────────────────────────
-- Ruta Tepic Centro
INSERT INTO public.ruta_clientes (ruta_id, cliente_id, orden)
SELECT r.id, c.id,
  CASE c.nombre
    WHEN 'Marisquería El Farol'       THEN 1
    WHEN 'Taquería Los Compadres'     THEN 2
    WHEN 'Pescadería y Mariscos Lety' THEN 3
    WHEN 'Lonchería Doña Cuca'        THEN 4
    WHEN 'Camaronería El Pacífico'    THEN 5
  END
FROM public.rutas r, public.clientes c
WHERE r.nombre = 'Ruta Tepic Centro'
  AND c.nombre IN ('Marisquería El Farol','Taquería Los Compadres','Pescadería y Mariscos Lety','Lonchería Doña Cuca','Camaronería El Pacífico');

-- Ruta Tepic Norte
INSERT INTO public.ruta_clientes (ruta_id, cliente_id, orden)
SELECT r.id, c.id,
  CASE c.nombre
    WHEN 'Restaurant El Rincón Marino' THEN 1
    WHEN 'Cenaduría La Güera'          THEN 2
    WHEN 'Cocina Don Chava'            THEN 3
  END
FROM public.rutas r, public.clientes c
WHERE r.nombre = 'Ruta Tepic Norte'
  AND c.nombre IN ('Restaurant El Rincón Marino','Cenaduría La Güera','Cocina Don Chava');

-- Ruta San Blas – Compostela
INSERT INTO public.ruta_clientes (ruta_id, cliente_id, orden)
SELECT r.id, c.id, row_number() OVER (ORDER BY c.nombre)
FROM public.rutas r, public.clientes c
WHERE r.nombre = 'Ruta San Blas – Compostela'
  AND c.nombre IN ('Mariscos La Playa','Mariscos El Camarón Gigante');

-- Ruta Nuevo Vallarta
INSERT INTO public.ruta_clientes (ruta_id, cliente_id, orden)
SELECT r.id, c.id, row_number() OVER (ORDER BY c.nombre)
FROM public.rutas r, public.clientes c
WHERE r.nombre = 'Ruta Nuevo Vallarta'
  AND c.nombre IN ('Hotel Boutique Nayar','Sabor a Mar Restaurant');

-- ─── CONFIRMAR ───────────────────────────────────────────────
SELECT 'Insumos: ' || count(*) FROM public.insumos
UNION ALL SELECT 'Marcas: '   || count(*) FROM public.marcas
UNION ALL SELECT 'Productos: '|| count(*) FROM public.productos
UNION ALL SELECT 'Recetas: '  || count(*) FROM public.recetas
UNION ALL SELECT 'Clientes: ' || count(*) FROM public.clientes
UNION ALL SELECT 'Rutas: '    || count(*) FROM public.rutas;
