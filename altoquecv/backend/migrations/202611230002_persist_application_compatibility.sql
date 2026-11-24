alter table public.tablero_postulaciones
    add column if not exists compatibilidad numeric(5, 2);

alter table public.tablero_postulaciones
    drop constraint if exists tablero_postulaciones_compatibilidad_check;

alter table public.tablero_postulaciones
    add constraint tablero_postulaciones_compatibilidad_check
    check (compatibilidad is null or compatibilidad between 0 and 100);
