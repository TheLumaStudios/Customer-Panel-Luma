create table if not exists public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  phone text not null,
  message text not null,
  status text not null default 'sent',
  cost numeric(10, 4) not null default 0,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.sms_logs enable row level security;

create policy "Admins can view all sms_logs"
  on public.sms_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'employee')
    )
  );

create policy "Admins can insert sms_logs"
  on public.sms_logs for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'employee')
    )
  );

create index sms_logs_customer_id_idx on public.sms_logs(customer_id);
create index sms_logs_sent_at_idx on public.sms_logs(sent_at desc);
