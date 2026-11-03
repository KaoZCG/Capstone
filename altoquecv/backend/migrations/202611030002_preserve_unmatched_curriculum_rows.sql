ALTER TABLE public.formacion_academica
    ALTER COLUMN institucion DROP NOT NULL,
    ALTER COLUMN grado_obtenido DROP NOT NULL;

ALTER TABLE public.trayectoria_laboral
    ALTER COLUMN empresa DROP NOT NULL,
    ALTER COLUMN titulo_cargo DROP NOT NULL,
    ALTER COLUMN fecha_ingreso DROP NOT NULL;
