-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade primary key,
  full_name text,
  default_currency text default 'THB',
  timezone text default 'Asia/Bangkok',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create function to handle new user
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create assets table
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'investment', 'real_estate', 'vehicle', 'other')),
  current_value numeric(15,2) not null default 0,
  currency text default 'THB',
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.assets enable row level security;

create policy "Users can view own assets"
  on public.assets for select
  using (auth.uid() = user_id);

create policy "Users can insert own assets"
  on public.assets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own assets"
  on public.assets for update
  using (auth.uid() = user_id);

create policy "Users can delete own assets"
  on public.assets for delete
  using (auth.uid() = user_id);

-- Create liabilities table
create table public.liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  type text not null check (type in ('credit_card', 'loan', 'mortgage', 'other')),
  current_balance numeric(15,2) not null default 0,
  interest_rate numeric(5,2),
  currency text default 'THB',
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.liabilities enable row level security;

create policy "Users can view own liabilities"
  on public.liabilities for select
  using (auth.uid() = user_id);

create policy "Users can insert own liabilities"
  on public.liabilities for insert
  with check (auth.uid() = user_id);

create policy "Users can update own liabilities"
  on public.liabilities for update
  using (auth.uid() = user_id);

create policy "Users can delete own liabilities"
  on public.liabilities for delete
  using (auth.uid() = user_id);

-- Create transactions table for income and expenses
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  amount numeric(15,2) not null,
  currency text default 'THB',
  description text,
  transaction_date date not null default current_date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Create net worth history table
create table public.net_worth_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  net_worth numeric(15,2) not null,
  date date not null,
  created_at timestamp with time zone not null default now(),
  unique(user_id, date)
);

alter table public.net_worth_history enable row level security;

create policy "Users can view own net worth history"
  on public.net_worth_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own net worth history"
  on public.net_worth_history for insert
  with check (auth.uid() = user_id);

-- Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add triggers for updated_at
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_assets_updated_at before update on public.assets
  for each row execute function public.update_updated_at_column();

create trigger update_liabilities_updated_at before update on public.liabilities
  for each row execute function public.update_updated_at_column();

create trigger update_transactions_updated_at before update on public.transactions
  for each row execute function public.update_updated_at_column();