-- AdaptAI workspace foundation. Apply with Supabase CLI or SQL editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists workspaces_owner_id_idx on public.workspaces(owner_id);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);

create table if not exists public.domain_configurations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  domain text not null check (domain in ('retail', 'healthcare', 'warehouse', 'hospitality')),
  config jsonb not null check (jsonb_typeof(config) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, domain)
);
create index if not exists domain_configurations_workspace_idx on public.domain_configurations(workspace_id);

create table if not exists public.business_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  configuration_id uuid not null references public.domain_configurations(id) on delete cascade,
  entity_key text not null check (char_length(entity_key) between 1 and 80),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(data) = 'object')
);
create index if not exists business_records_workspace_entity_idx on public.business_records(workspace_id, entity_key, created_at desc);
create index if not exists business_records_configuration_idx on public.business_records(configuration_id);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace and m.user_id = (select auth.uid())
  )
$$;

create or replace function public.is_workspace_owner(target_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace and m.user_id = (select auth.uid()) and m.role = 'owner'
  )
$$;

create or replace function public.bootstrap_adaptai_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  insert into public.workspaces(name, owner_id)
  values (coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)) || '''s workspace', new.id);
  return new;
end
$$;

create or replace function public.add_workspace_owner_membership()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.workspace_members(workspace_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end
$$;

drop trigger if exists on_adaptai_workspace_created on public.workspaces;
create trigger on_adaptai_workspace_created after insert on public.workspaces
for each row execute function public.add_workspace_owner_membership();

drop trigger if exists on_adaptai_user_created on auth.users;
create trigger on_adaptai_user_created after insert on auth.users
for each row execute function public.bootstrap_adaptai_user();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.domain_configurations enable row level security;
alter table public.business_records enable row level security;

create policy "profiles select self" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles update self" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members read workspaces" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "users create owned workspaces" on public.workspaces for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owners update workspaces" on public.workspaces for update to authenticated using (public.is_workspace_owner(id)) with check (public.is_workspace_owner(id));
create policy "owners delete workspaces" on public.workspaces for delete to authenticated using (public.is_workspace_owner(id));

create policy "members read memberships" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "owners add memberships" on public.workspace_members for insert to authenticated with check (public.is_workspace_owner(workspace_id));
create policy "owners update memberships" on public.workspace_members for update to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));
create policy "owners remove memberships" on public.workspace_members for delete to authenticated using (public.is_workspace_owner(workspace_id));

create policy "members read configurations" on public.domain_configurations for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members create configurations" on public.domain_configurations for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "members update configurations" on public.domain_configurations for update to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "owners delete configurations" on public.domain_configurations for delete to authenticated using (public.is_workspace_owner(workspace_id));

create policy "members read business records" on public.business_records for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members create business records" on public.business_records for insert to authenticated with check (
  public.is_workspace_member(workspace_id) and exists (
    select 1 from public.domain_configurations c where c.id = configuration_id and c.workspace_id = business_records.workspace_id
  )
);
create policy "members update business records" on public.business_records for update to authenticated using (public.is_workspace_member(workspace_id)) with check (
  public.is_workspace_member(workspace_id) and exists (
    select 1 from public.domain_configurations c where c.id = configuration_id and c.workspace_id = business_records.workspace_id
  )
);
create policy "owners delete business records" on public.business_records for delete to authenticated using (public.is_workspace_owner(workspace_id));

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.domain_configurations to authenticated;
grant select, insert, update, delete on public.business_records to authenticated;
