alter table public.tablero_postulaciones
    add column if not exists url_oferta text;

alter table public.ofertas_laborum
    add column if not exists notas_usuario text not null default '';

alter table public.ofertas_laborum
    add column if not exists origen_ingreso text not null default 'legacy';

delete from public.ofertas_laborum
where origen_ingreso = 'legacy';

alter table public.ofertas_laborum
    drop column if exists descripcion;

create unique index if not exists tablero_postulaciones_usuario_url_oferta_key
    on public.tablero_postulaciones (usuario_id, url_oferta)
