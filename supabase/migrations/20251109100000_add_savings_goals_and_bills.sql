-- Create savings_goals table
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  target_amount numeric(15,2) not null,
  current_amount numeric(15,2) not null default 0,
  currency text default 'THB',
  target_date date,
  category text,
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.savings_goals enable row level security;

create policy "Users can view own savings goals"
  on public.savings_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own savings goals"
  on public.savings_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own savings goals"
  on public.savings_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own savings goals"
  on public.savings_goals for delete
  using (auth.uid() = user_id);

-- Create bills table
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  amount numeric(15,2) not null,
  currency text default 'THB',
  due_date date not null,
  category text,
  is_recurring boolean default false,
  recurrence_period text check (recurrence_period in ('monthly', 'quarterly', 'yearly', 'weekly')),
  is_paid boolean default false,
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.bills enable row level security;

create policy "Users can view own bills"
  on public.bills for select
  using (auth.uid() = user_id);

create policy "Users can insert own bills"
  on public.bills for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bills"
  on public.bills for update
  using (auth.uid() = user_id);

create policy "Users can delete own bills"
  on public.bills for delete
  using (auth.uid() = user_id);

-- Add emergency_fund_target to profiles
alter table public.profiles add column emergency_fund_target numeric(15,2) default 0;

-- Add triggers for updated_at
create trigger update_savings_goals_updated_at before update on public.savings_goals
  for each row execute function public.update_updated_at_column();

create trigger update_bills_updated_at before update on public.bills
  for each row execute function public.update_updated_at_column();
