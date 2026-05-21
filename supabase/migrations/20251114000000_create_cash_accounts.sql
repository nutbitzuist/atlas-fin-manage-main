-- Create cash_accounts table
create table public.cash_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  bank_name text not null,
  account_type text not null,
  account_number text,
  balance numeric(15,2) not null default 0,
  currency text default 'THB',
  interest_rate numeric(5,2),
  status text default 'active' check (status in ('active', 'archived')),
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.cash_accounts enable row level security;

create policy "Users can view own cash accounts"
  on public.cash_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own cash accounts"
  on public.cash_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cash accounts"
  on public.cash_accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own cash accounts"
  on public.cash_accounts for delete
  using (auth.uid() = user_id);

-- Add trigger for updated_at
create trigger update_cash_accounts_updated_at before update on public.cash_accounts
  for each row execute function public.update_updated_at_column();
