ALTER TABLE public.trayectoria_laboral
    ADD COLUMN IF NOT EXISTS ubicacion character varying,
    ADD COLUMN IF NOT EXISTS tipo_jornada character varying;

NOTIFY pgrst, 'reload schema';
