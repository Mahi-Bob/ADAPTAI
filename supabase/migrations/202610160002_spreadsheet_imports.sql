create table if not exists public.spreadsheet_import_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  configuration_id uuid not null references public.domain_configurations(id) on delete cascade,
  entity_key text not null check (char_length(entity_key) between 1 and 80),
  idempotency_key uuid not null,
  source_name text not null check (char_length(source_name) between 1 and 255),
  status text not null check (status in ('processing', 'completed', 'failed')),
  total_rows integer not null default 0 check (total_rows between 0 and 500),
  imported_rows integer not null default 0 check (imported_rows between 0 and 500),
  skipped_rows integer not null default 0 check (skipped_rows between 0 and 500),
  error_report jsonb not null default '[]'::jsonb check (jsonb_typeof(error_report) = 'array'),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (workspace_id, idempotency_key),
  unique (id, workspace_id, configuration_id, entity_key)
);

create index if not exists spreadsheet_import_jobs_workspace_idx
  on public.spreadsheet_import_jobs(workspace_id, created_at desc);

alter table public.business_records
  add column if not exists import_job_id uuid,
  add column if not exists source_row integer;

alter table public.business_records
  add constraint business_records_import_job_fk
    foreign key (import_job_id) references public.spreadsheet_import_jobs(id) on delete cascade,
  add constraint business_records_import_row_check
    check ((import_job_id is null and source_row is null) or (import_job_id is not null and source_row between 2 and 501)),
  add constraint business_records_import_source_row_unique
    unique (import_job_id, source_row);

alter table public.spreadsheet_import_jobs enable row level security;

create policy "members read spreadsheet imports" on public.spreadsheet_import_jobs
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "members create own spreadsheet imports" on public.spreadsheet_import_jobs
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.is_workspace_member(workspace_id)
    and exists (
      select 1 from public.domain_configurations c
      where c.id = configuration_id and c.workspace_id = spreadsheet_import_jobs.workspace_id
    )
  );

create policy "creators update spreadsheet imports" on public.spreadsheet_import_jobs
  for update to authenticated
  using (created_by = (select auth.uid()) and public.is_workspace_member(workspace_id))
  with check (
    created_by = (select auth.uid())
    and public.is_workspace_member(workspace_id)
    and exists (
      select 1 from public.domain_configurations c
      where c.id = configuration_id and c.workspace_id = spreadsheet_import_jobs.workspace_id
    )
  );

drop policy if exists "members create business records" on public.business_records;
create policy "members create business records" on public.business_records
  for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and exists (
      select 1 from public.domain_configurations c
      where c.id = configuration_id and c.workspace_id = business_records.workspace_id
    )
    and (
      import_job_id is null
      or exists (
        select 1 from public.spreadsheet_import_jobs j
        where j.id = import_job_id
          and j.workspace_id = business_records.workspace_id
          and j.configuration_id = business_records.configuration_id
          and j.entity_key = business_records.entity_key
          and j.created_by = (select auth.uid())
      )
    )
  );

drop policy if exists "members update business records" on public.business_records;
create policy "members upsert imported business records" on public.business_records
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (
    public.is_workspace_member(workspace_id)
    and exists (
      select 1 from public.domain_configurations c
      where c.id = configuration_id and c.workspace_id = business_records.workspace_id
    )
    and (
      import_job_id is null
      or exists (
        select 1 from public.spreadsheet_import_jobs j
        where j.id = import_job_id
          and j.workspace_id = business_records.workspace_id
          and j.configuration_id = business_records.configuration_id
          and j.entity_key = business_records.entity_key
          and j.created_by = (select auth.uid())
      )
    )
  );

grant select, insert, update on public.spreadsheet_import_jobs to authenticated;
