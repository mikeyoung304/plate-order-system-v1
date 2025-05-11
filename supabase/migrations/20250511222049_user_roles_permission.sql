-- Grant necessary permissions
grant usage on schema public to authenticated;
grant select, insert on table public.user_roles to authenticated;

-- Enable RLS
alter table public.user_roles enable row level security;

-- Policies
create policy "Allow users to insert their own role"
  on public.user_roles
  as permissive
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Allow users to read their own role"
  on public.user_roles
  as permissive
  for select
  to authenticated
  using (auth.uid() = user_id);
