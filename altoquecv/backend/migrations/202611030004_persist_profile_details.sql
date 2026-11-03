ALTER TABLE public.perfiles_candidatos
    ADD COLUMN IF NOT EXISTS cargo_objetivo character varying,
    ADD COLUMN IF NOT EXISTS region character varying,
    ADD COLUMN IF NOT EXISTS comuna character varying,
    ADD COLUMN IF NOT EXISTS url_linkedin character varying,
    ADD COLUMN IF NOT EXISTS url_portafolio character varying,
    ADD COLUMN IF NOT EXISTS resumen_profesional text;

ALTER TABLE public.formacion_academica
    ADD COLUMN IF NOT EXISTS fecha_inicio_texto character varying,
    ADD COLUMN IF NOT EXISTS fecha_termino_texto character varying,
    ADD COLUMN IF NOT EXISTS ubicacion character varying,
    ADD COLUMN IF NOT EXISTS modalidad character varying,
    ADD COLUMN IF NOT EXISTS descripcion text,
    ADD COLUMN IF NOT EXISTS especialidades jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS es_estudio_actual boolean NOT NULL DEFAULT false;

ALTER TABLE public.trayectoria_laboral
    ADD COLUMN IF NOT EXISTS fecha_ingreso_texto character varying,
    ADD COLUMN IF NOT EXISTS fecha_salida_texto character varying;

NOTIFY pgrst, 'reload schema';
