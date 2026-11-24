alter table public.usuarios
    add column if not exists plan_suscripcion text not null default 'free';

alter table public.usuarios
    drop constraint if exists usuarios_plan_suscripcion_check;

alter table public.usuarios
    add constraint usuarios_plan_suscripcion_check
    check (plan_suscripcion in ('free', 'premium'));

create or replace function public.proteger_plan_suscripcion()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
    if new.plan_suscripcion is distinct from old.plan_suscripcion
       and auth.role() is not null
       and auth.role() <> 'service_role' then
        raise exception 'Solo la administración puede cambiar el plan de suscripción'
            using errcode = '42501';
    end if;
    return new;
end;
$$;

drop trigger if exists usuarios_proteger_plan_suscripcion on public.usuarios;
create trigger usuarios_proteger_plan_suscripcion
    before update of plan_suscripcion on public.usuarios
    for each row execute function public.proteger_plan_suscripcion();

alter table public.tablero_postulaciones
    add column if not exists tipo text not null default 'laborum',
    add column if not exists preguntas_respuestas jsonb not null default '[]'::jsonb;

alter table public.tablero_postulaciones
    drop constraint if exists tablero_postulaciones_tipo_check;

alter table public.tablero_postulaciones
    add constraint tablero_postulaciones_tipo_check
    check (tipo in ('laborum', 'trabajando'));

create table if not exists public.usos_ia_postulaciones (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null references public.usuarios(id) on delete cascade,
    fecha_chile date not null,
    url_oferta text not null,
    tipo text not null check (tipo in ('laborum', 'trabajando')),
    cargo text not null,
    empresa text not null,
    preguntas_respuestas jsonb not null default '[]'::jsonb,
    estado text not null default 'pending'
        check (estado in ('pending', 'completed', 'failed')),
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    constraint usos_ia_postulaciones_usuario_fecha_url_key
        unique (usuario_id, fecha_chile, url_oferta)
);

create index if not exists usos_ia_postulaciones_usuario_fecha_estado_idx
    on public.usos_ia_postulaciones (usuario_id, fecha_chile, estado);

alter table public.usos_ia_postulaciones enable row level security;

create or replace function public.reservar_uso_ia_postulacion(
    p_usuario_id uuid,
    p_url_oferta text,
    p_tipo text,
    p_cargo text,
    p_empresa text,
    p_preguntas jsonb
)
returns table (
    permitido boolean,
    en_proceso boolean,
    subscription_plan text,
    usos_hoy integer,
    limite_diario integer,
    restantes integer,
    uso_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_plan text;
    v_fecha date := timezone('America/Santiago', now())::date;
    v_uso_id uuid;
    v_estado text;
    v_usos integer;
    v_limite integer;
begin
    update public.usos_ia_postulaciones as uso
    set estado = 'failed',
        actualizado_en = now()
    where uso.usuario_id = p_usuario_id
      and uso.fecha_chile = timezone('America/Santiago', now())::date
      and uso.url_oferta = p_url_oferta
      and uso.estado = 'pending'
      and uso.actualizado_en < now() - interval '10 minutes';

    select usuarios.plan_suscripcion
    into v_plan
    from public.usuarios
    where usuarios.id = p_usuario_id
    for update;

    if not found then
        raise exception 'No se encontró el usuario' using errcode = 'P0002';
    end if;

    v_limite := case when v_plan = 'premium' then null else 5 end;

    select uso.id, uso.estado
    into v_uso_id, v_estado
    from public.usos_ia_postulaciones as uso
    where uso.usuario_id = p_usuario_id
      and uso.fecha_chile = v_fecha
      and uso.url_oferta = p_url_oferta;

    if v_estado = 'pending' then
        select count(*)::integer
        into v_usos
        from public.usos_ia_postulaciones as uso
        where uso.usuario_id = p_usuario_id
          and uso.fecha_chile = v_fecha
          and uso.estado in ('pending', 'completed');

        return query select false, true, v_plan, v_usos, v_limite,
            case when v_limite is null then null else greatest(v_limite - v_usos, 0) end,
            v_uso_id;
        return;
    end if;

    select count(*)::integer
    into v_usos
    from public.usos_ia_postulaciones as uso
    where uso.usuario_id = p_usuario_id
      and uso.fecha_chile = v_fecha
      and uso.estado in ('pending', 'completed');

    if v_plan <> 'premium' and v_estado is distinct from 'completed'
       and v_usos >= v_limite then
        return query select false, false, v_plan, v_usos, v_limite, 0, null::uuid;
        return;
    end if;

    insert into public.usos_ia_postulaciones as uso (
        usuario_id,
        fecha_chile,
        url_oferta,
        tipo,
        cargo,
        empresa,
        preguntas_respuestas,
        estado,
        actualizado_en
    )
    values (
        p_usuario_id,
        v_fecha,
        p_url_oferta,
        p_tipo,
        p_cargo,
        p_empresa,
        coalesce(p_preguntas, '[]'::jsonb),
        'pending',
        now()
    )
    on conflict (usuario_id, fecha_chile, url_oferta)
    do update set
        tipo = excluded.tipo,
        cargo = excluded.cargo,
        empresa = excluded.empresa,
        preguntas_respuestas = excluded.preguntas_respuestas,
        estado = 'pending',
        actualizado_en = now()
    returning uso.id into v_uso_id;

    select count(*)::integer
    into v_usos
    from public.usos_ia_postulaciones as uso
    where uso.usuario_id = p_usuario_id
      and uso.fecha_chile = v_fecha
      and uso.estado in ('pending', 'completed');

    return query select true, false, v_plan, v_usos, v_limite,
        case when v_limite is null then null else greatest(v_limite - v_usos, 0) end,
        v_uso_id;
end;
$$;

revoke all on function public.reservar_uso_ia_postulacion(uuid, text, text, text, text, jsonb)
    from public, anon, authenticated;
grant execute on function public.reservar_uso_ia_postulacion(uuid, text, text, text, text, jsonb)
    to service_role;
