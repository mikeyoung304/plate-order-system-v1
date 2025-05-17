-- Rename user_roles table to profiles and add name column
alter table public.user_roles rename to profiles;

-- Add name column as nullable first
alter table public.profiles add column name text;

-- Set default value for existing rows
update public.profiles set name = '' where name is null;

-- Now make it not null
alter table public.profiles alter column name set not null;

-- Update all references in functions and policies
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
  declare
    claims jsonb;
    user_role public.app_role;
  begin
    -- Fetch the user role in the profiles table
    select role into user_role from public.profiles where user_id = (event->>'user_id')::uuid;
    claims := event->'claims';
    if user_role is not null then
      -- Set the claim
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      claims := jsonb_set(claims, '{user_role}', 'null');
    end if;
    -- Update the 'claims' object in the original event
    event := jsonb_set(event, '{claims}', claims);
    -- Return the modified or original event
    return event;
  end;
$$;

-- Update function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  raw_user_meta_data jsonb;
  user_role public.app_role;
begin
  -- Get the raw user metadata
  raw_user_meta_data := new.raw_user_meta_data;
  
  -- Extract the role from metadata
  if raw_user_meta_data ? 'role' then
    user_role := (raw_user_meta_data->>'role')::public.app_role;
    
    -- Insert into profiles
    insert into public.profiles (user_id, role, name)
    values (new.id, user_role, coalesce(raw_user_meta_data->>'name', ''));
  end if;
  
  return new;
end;
$$;

-- Drop and recreate policies for the profiles table
drop policy if exists "Allow users to insert their own role" on public.profiles;
create policy "Allow users to insert their own profile"
  on public.profiles
  as permissive
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Allow users to read their own role" on public.profiles;
create policy "Allow users to read their own profile"
  on public.profiles
  as permissive
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Allow all authenticated users to read resident profiles
create policy "Allow users to read resident profiles"
  on public.profiles
  as permissive
  for select
  to authenticated
  using (role = 'resident');

-- Drop and recreate policies for orders
drop policy if exists "Admins can create orders" on public.orders;
drop policy if exists "Admins can read orders" on public.orders;
drop policy if exists "Admins can update orders" on public.orders;
drop policy if exists "Admins can delete orders" on public.orders;
drop policy if exists "Servers can create orders" on public.orders;
drop policy if exists "Servers can read orders" on public.orders;
drop policy if exists "Servers can update orders" on public.orders;
drop policy if exists "Cooks can create orders" on public.orders;
drop policy if exists "Cooks can read orders" on public.orders;
drop policy if exists "Cooks can update orders" on public.orders;

-- Create admin policies
create policy "Admins can create orders"
  on public.orders
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
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
      select 1 from public.profiles
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
      select 1 from public.profiles
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
      select 1 from public.profiles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Create server policies
create policy "Servers can create orders"
  on public.orders
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
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
      select 1 from public.profiles
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
      select 1 from public.profiles
      where user_id = auth.uid()
      and role = 'server'
    )
  );

-- Create cook policies
create policy "Cooks can create orders"
  on public.orders
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
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
      select 1 from public.profiles
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
      select 1 from public.profiles
      where user_id = auth.uid()
      and role = 'cook'
    )
  );

-- Update table permissions
grant all on table public.profiles to supabase_auth_admin;
revoke all on table public.profiles from authenticated, anon, public;
create policy "Allow auth admin to read profiles" ON public.profiles
as permissive for select
to supabase_auth_admin
using (true);

-- Grant necessary permissions to authenticated users
grant usage on schema public to authenticated;
grant select, insert on table public.profiles to authenticated;
