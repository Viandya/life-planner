-- «Три жизни»: личный планер. Только новые объекты с префиксом lp_, таблицы Duo не меняются.
-- Применено в проекте Supabase Duo (fuisujbwjwbddtfstkbh) 28.10.2026.
-- Токен бота хранится в Vault под именем lp_bot_token (не в этом файле).

create table public.lp_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tg_id bigint unique,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
comment on table public.lp_state is 'Три жизни: всё состояние приложения пользователя одним документом';

create table public.lp_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('tx', 'deadline')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);
comment on table public.lp_inbox is 'Три жизни: записи из бота (траты, дедлайны), приложение забирает их при открытии';
create index lp_inbox_user_idx on public.lp_inbox(user_id);

alter table public.lp_state enable row level security;
alter table public.lp_inbox enable row level security;

create policy lp_state_select on public.lp_state for select to authenticated using (user_id = (select auth.uid()));
create policy lp_state_insert on public.lp_state for insert to authenticated with check (user_id = (select auth.uid()));
create policy lp_state_update on public.lp_state for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy lp_inbox_select on public.lp_inbox for select to authenticated using (user_id = (select auth.uid()));
create policy lp_inbox_delete on public.lp_inbox for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.lp_state, public.lp_inbox from anon;
grant select, insert, update on public.lp_state to authenticated;
grant select, delete on public.lp_inbox to authenticated;

create or replace function public.lp_find_user(p_tg bigint)
returns uuid language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select user_id from public.lp_state where tg_id = p_tg),
    (select user_id from private.tg_links where chat_id = p_tg order by linked_at desc limit 1)
  )
$$;

create or replace function public.lp_bot_token()
returns text language sql stable security definer set search_path = '' as $$
  select private.secret('lp_bot_token')
$$;

revoke execute on function public.lp_find_user(bigint) from public, anon, authenticated;
revoke execute on function public.lp_bot_token() from public, anon, authenticated;
grant execute on function public.lp_find_user(bigint) to service_role;
grant execute on function public.lp_bot_token() to service_role;
