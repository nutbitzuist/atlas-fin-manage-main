-- Create investments table
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  investment_type text not null check (investment_type in ('mutual_fund', 'stock', 'bond', 'mt4_mt5', 'business')),

  -- Common fields
  name text not null,
  description text,
  currency text default 'THB',
  status text default 'active' check (status in ('active', 'archived')),

  -- Investment amount fields
  initial_investment numeric(15,2),
  current_value numeric(15,2),

  -- Mutual Fund specific fields
  fund_code text,
  fund_category text check (fund_category in ('RMF', 'LTF', 'Thai ESG', 'SSF', 'General')),
  fund_house text,
  units numeric(15,4),
  avg_cost numeric(15,4),
  current_nav numeric(15,4),

  -- Stock specific fields
  symbol text,
  company_name text,
  exchange text,
  shares numeric(15,4),
  avg_price numeric(15,4),
  current_price numeric(15,4),
  sector text,

  -- Bond specific fields
  bond_type text,
  issuer text,
  face_value numeric(15,2),
  coupon_rate numeric(5,2),
  maturity_date date,

  -- MT4/MT5 specific fields
  broker text,
  account_number text,
  account_type text,
  balance numeric(15,2),
  equity numeric(15,2),
  profit_loss numeric(15,2),

  -- Business investment specific fields
  business_name text,
  investment_date date,
  ownership_percent numeric(5,2),

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.investments enable row level security;

create policy "Users can view own investments"
  on public.investments for select
  using (auth.uid() = user_id);

create policy "Users can insert own investments"
  on public.investments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own investments"
  on public.investments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own investments"
  on public.investments for delete
  using (auth.uid() = user_id);

-- Add trigger for updated_at
create trigger update_investments_updated_at before update on public.investments
  for each row execute function public.update_updated_at_column();
