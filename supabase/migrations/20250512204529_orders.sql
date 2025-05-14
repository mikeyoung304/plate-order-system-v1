-- Create orders schema
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  table_id uuid references public.tables on delete cascade not null,
  seat_id uuid references public.seats on delete cascade not null,
  resident_id uuid references auth.users on delete cascade not null,
  server_id uuid references auth.users on delete cascade not null,
  items jsonb not null,
  transcript text,
  status text not null default 'new',
  type text not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.orders enable row level security;

-- Grant access to authenticated users
grant usage on schema public to authenticated;
grant select, insert, update on public.orders to authenticated;

-- Admin policies for orders
create policy "Admins can create orders"
  on public.orders
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can read orders"
  on public.orders
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can update orders"
  on public.orders
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can delete orders"
  on public.orders
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Server policies for orders
create policy "Servers can create orders"
  on public.orders
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'server'
    )
  );

create policy "Servers can read orders"
  on public.orders
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'server'
    )
  );

create policy "Servers can update orders"
  on public.orders
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'server'
    )
  );

-- Cook policies for orders
create policy "Cooks can create orders"
  on public.orders
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'cook'
    )
  );

create policy "Cooks can read orders"
  on public.orders
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'cook'
    )
  );

create policy "Cooks can update orders"
  on public.orders
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'cook'
    )
  );

-- Add indexes for better performance
create index orders_table_id_idx on public.orders(table_id);
create index orders_seat_id_idx on public.orders(seat_id);
create index orders_resident_id_idx on public.orders(resident_id);
create index orders_server_id_idx on public.orders(server_id);
create index orders_created_at_idx on public.orders(created_at);
create index orders_status_idx on public.orders(status);
