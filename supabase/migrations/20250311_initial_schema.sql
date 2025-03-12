-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Drop existing triggers if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists handle_users_updated_at on public.users;
drop trigger if exists handle_events_updated_at on public.events;
drop trigger if exists handle_roles_updated_at on public.roles;
drop trigger if exists handle_volunteers_updated_at on public.volunteers;
drop trigger if exists handle_messages_updated_at on public.messages;
drop trigger if exists handle_system_settings_updated_at on public.system_settings;

-- Drop existing functions if they exist
drop function if exists public.handle_new_user();
drop function if exists public.handle_updated_at();

-- Create auth schema triggers for handling user management
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Drop existing tables if they exist
drop table if exists public.messages cascade;
drop table if exists public.volunteers cascade;
drop table if exists public.roles cascade;
drop table if exists public.events cascade;
drop table if exists public.users cascade;
drop table if exists public.system_settings cascade;

-- Create users table
create table if not exists public.users (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    email text unique not null,
    image text,
    user_role text not null default 'VOLUNTEER',
    email_notifications boolean not null default true,
    unread_messages integer not null default 0,
    provider_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create events table
create table if not exists public.events (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    location text,
    start_date timestamp with time zone not null,
    end_date timestamp with time zone not null,
    owner_id uuid references public.users(id) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create roles table
create table if not exists public.roles (
    id uuid default uuid_generate_v4() primary key,
    event_id uuid references public.events(id) not null,
    name text not null,
    description text,
    capacity integer not null default 1,
    max_capacity integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create volunteers table
create table if not exists public.volunteers (
    id uuid default uuid_generate_v4() primary key,
    role_id uuid references public.roles(id) not null,
    user_id uuid references public.users(id) not null,
    name text not null,
    email text not null,
    phone text,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table
create table if not exists public.messages (
    id uuid default uuid_generate_v4() primary key,
    event_id uuid references public.events(id) not null,
    sender_id uuid references public.users(id) not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create system_settings table
create table if not exists public.system_settings (
    id uuid default uuid_generate_v4() primary key,
    key text unique not null,
    value text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create updated_at triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger handle_users_updated_at
    before update on public.users
    for each row
    execute function public.handle_updated_at();

create trigger handle_events_updated_at
    before update on public.events
    for each row
    execute function public.handle_updated_at();

create trigger handle_roles_updated_at
    before update on public.roles
    for each row
    execute function public.handle_updated_at();

create trigger handle_volunteers_updated_at
    before update on public.volunteers
    for each row
    execute function public.handle_updated_at();

create trigger handle_messages_updated_at
    before update on public.messages
    for each row
    execute function public.handle_updated_at();

create trigger handle_system_settings_updated_at
    before update on public.system_settings
    for each row
    execute function public.handle_updated_at();

-- Drop existing indexes if they exist
drop index if exists users_email_idx;
drop index if exists events_owner_id_idx;
drop index if exists roles_event_id_idx;
drop index if exists volunteers_role_id_idx;
drop index if exists volunteers_user_id_idx;
drop index if exists messages_event_id_idx;
drop index if exists messages_sender_id_idx;

-- Create indexes
create index if not exists users_email_idx on public.users(email);
create index if not exists events_owner_id_idx on public.events(owner_id);
create index if not exists roles_event_id_idx on public.roles(event_id);
create index if not exists volunteers_role_id_idx on public.volunteers(role_id);
create index if not exists volunteers_user_id_idx on public.volunteers(user_id);
create index if not exists messages_event_id_idx on public.messages(event_id);
create index if not exists messages_sender_id_idx on public.messages(sender_id);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.roles enable row level security;
alter table public.volunteers enable row level security;
alter table public.messages enable row level security;
alter table public.system_settings enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can read their own profile" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Anyone can read events" on public.events;
drop policy if exists "Owners can create events" on public.events;
drop policy if exists "Owners can update their events" on public.events;
drop policy if exists "Owners can delete their events" on public.events;
drop policy if exists "Anyone can read roles" on public.roles;
drop policy if exists "Event owners can manage roles" on public.roles;
drop policy if exists "Anyone can read volunteers" on public.volunteers;
drop policy if exists "Users can manage their volunteer records" on public.volunteers;
drop policy if exists "Event owners can manage volunteers" on public.volunteers;
drop policy if exists "Anyone can read messages" on public.messages;
drop policy if exists "Users can create messages" on public.messages;
drop policy if exists "Anyone can read system settings" on public.system_settings;

-- Create RLS policies
create policy "Users can read their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Anyone can read events"
  on public.events for select
  to authenticated
  using (true);

create policy "Owners can create events"
  on public.events for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners can update their events"
  on public.events for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their events"
  on public.events for delete
  using (auth.uid() = owner_id);

create policy "Anyone can read roles"
  on public.roles for select
  to authenticated
  using (true);

create policy "Event owners can manage roles"
  on public.roles for all
  using (
    exists (
      select 1 from public.events
      where events.id = roles.event_id
      and events.owner_id = auth.uid()
    )
  );

create policy "Anyone can read volunteers"
  on public.volunteers for select
  to authenticated
  using (true);

create policy "Users can manage their volunteer records"
  on public.volunteers for all
  using (user_id = auth.uid());

create policy "Event owners can manage volunteers"
  on public.volunteers for all
  using (
    exists (
      select 1 from public.events
      join public.roles on roles.event_id = events.id
      where roles.id = volunteers.role_id
      and events.owner_id = auth.uid()
    )
  );

create policy "Anyone can read messages"
  on public.messages for select
  to authenticated
  using (true);

create policy "Users can create messages"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy "Anyone can read system settings"
  on public.system_settings for select
  to authenticated
  using (true);
