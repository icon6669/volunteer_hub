-- Enable necessary extensions if not already enabled
create extension if not exists "uuid-ossp";

-- Create system_settings table if it doesn't exist
create table if not exists public.system_settings (
    id uuid default uuid_generate_v4() primary key,
    key text unique not null,
    value text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create or update the handle_updated_at function if it doesn't exist
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create trigger for system_settings table if it doesn't exist
-- First check if the table exists to avoid errors
do $$
begin
    if exists (select from pg_tables where schemaname = 'public' and tablename = 'system_settings') then
        -- Drop the trigger if it exists
        drop trigger if exists handle_system_settings_updated_at on public.system_settings;
        
        -- Create the trigger
        create trigger handle_system_settings_updated_at
            before update on public.system_settings
            for each row
            execute function public.handle_updated_at();
    end if;
end
$$;

-- Enable Row Level Security if the table exists
do $$
begin
    if exists (select from pg_tables where schemaname = 'public' and tablename = 'system_settings') then
        alter table public.system_settings enable row level security;
        
        -- Drop the policy if it exists
        drop policy if exists "Anyone can read system settings" on public.system_settings;
        
        -- Create the policy
        create policy "Anyone can read system settings"
          on public.system_settings for select
          using (true);
    end if;
end
$$;
