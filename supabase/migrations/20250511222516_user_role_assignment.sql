-- Function to handle new user creation
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
    
    -- Insert the role
    insert into public.user_roles (user_id, role)
    values (new.id, user_role);
  end if;
  
  return new;
end;
$$;

-- Grant execute on the function to supabase_auth_admin
grant execute on function public.handle_new_user to supabase_auth_admin;

-- Create the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
