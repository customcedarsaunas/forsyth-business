create table public.assistant_drafts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 request_key text not null,
 payload jsonb not null,
 created_at timestamptz not null default now(),
 unique(user_id,request_key),
 check (jsonb_typeof(payload)='object'),
 check (payload->'document'->>'status'='draft'),
 check (payload->'document'->>'type' in ('invoice','estimate'))
);
alter table public.assistant_drafts enable row level security;
revoke all on public.assistant_drafts from anon,authenticated;
grant select on public.assistant_drafts to authenticated;
create policy assistant_drafts_read_own on public.assistant_drafts for select to authenticated using ((select auth.uid())=user_id);