create table if not exists public.ofertas_laborum (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null references public.usuarios(id) on delete cascade,
    titulo text not null,
    empresa text not null default 'Confidencial',
    ubicacion text not null default 'Ubicación no informada',
    url text not null,
    fecha_captura timestamptz not null default now(),
    ultima_vista timestamptz not null default now(),
    constraint ofertas_laborum_usuario_url_key unique (usuario_id, url)
);

create index if not exists ofertas_laborum_usuario_ultima_vista_idx
    on public.ofertas_laborum (usuario_id, ultima_vista desc);

alter table public.ofertas_laborum enable row level security;
