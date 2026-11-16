CREATE TABLE IF NOT EXISTS public.credenciales_proveedores_ia (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    proveedor text NOT NULL,
    nombre text NOT NULL,
    modelo_id text,
    api_key_cifrada text NOT NULL,
    version_cifrado integer NOT NULL,
    es_activa boolean NOT NULL DEFAULT false,
    creada_en timestamptz NOT NULL DEFAULT now(),
    actualizada_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT credenciales_proveedores_ia_usuario_proveedor_nombre_key
        UNIQUE (usuario_id, proveedor, nombre)
);

ALTER TABLE public.credenciales_proveedores_ia ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
