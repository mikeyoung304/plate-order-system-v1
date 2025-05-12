-- Create tables schema
create table public.tables (
  id uuid default gen_random_uuid() primary key,
  label integer not null,
  type text not null,
  status text not null default 'available'
);

-- Create seats schema
create table public.seats (
  id uuid default gen_random_uuid() primary key,
  table_id uuid references public.tables on delete cascade not null,
  label integer not null,
  status text not null default 'available'
);

-- Enable RLS
alter table public.tables enable row level security;
alter table public.seats enable row level security;

-- Grant access to authenticated users
grant usage on schema public to authenticated;
grant select, update on public.tables to authenticated;
grant select, update on public.seats to authenticated;

-- Admin policies for tables
create policy "Admins can create tables"
  on public.tables
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can delete tables"
  on public.tables
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Server/Cook policies for tables
create policy "Servers and cooks can read tables"
  on public.tables
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('server', 'cook')
    )
  );

create policy "Servers and cooks can update tables"
  on public.tables
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('server', 'cook')
    )
  );

-- Admin policies for seats
create policy "Admins can create seats"
  on public.seats
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can delete seats"
  on public.seats
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Server/Cook policies for seats
create policy "Servers and cooks can read seats"
  on public.seats
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('server', 'cook')
    )
  );

create policy "Servers and cooks can update seats"
  on public.seats
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('server', 'cook')
    )
  );

-- Add indexes for better performance
create index tables_label_idx on public.tables(label);
create index seats_table_id_idx on public.seats(table_id);
create index seats_label_idx on public.seats(label);
