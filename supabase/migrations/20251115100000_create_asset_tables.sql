-- Create real_estate table
create table public.real_estate (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  address text not null,
  property_type text not null check (property_type in ('Primary Residence', 'Rental', 'Land', 'Commercial', 'Condo', 'Other')),
  purchase_price numeric(15,2) not null,
  current_value numeric(15,2) not null,
  purchase_date date,
  rental_income numeric(15,2) default 0,
  rental_status text check (rental_status in ('Owner Occupied', 'Occupied', 'Vacant', 'N/A')),
  currency text default 'THB',
  description text,
  status text default 'active' check (status in ('active', 'archived')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.real_estate enable row level security;

create policy "Users can view own real estate"
  on public.real_estate for select
  using (auth.uid() = user_id);

create policy "Users can insert own real estate"
  on public.real_estate for insert
  with check (auth.uid() = user_id);

create policy "Users can update own real estate"
  on public.real_estate for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own real estate"
  on public.real_estate for delete
  using (auth.uid() = user_id);

create trigger update_real_estate_updated_at before update on public.real_estate
  for each row execute function public.update_updated_at_column();

-- Create vehicles table
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  vehicle_type text not null check (vehicle_type in ('Car', 'Motorcycle', 'Truck', 'SUV', 'Van', 'Other')),
  make text not null,
  model text not null,
  year integer not null,
  purchase_price numeric(15,2) not null,
  current_value numeric(15,2) not null,
  purchase_date date,
  license_plate text,
  vin text,
  currency text default 'THB',
  description text,
  status text default 'active' check (status in ('active', 'sold', 'archived')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.vehicles enable row level security;

create policy "Users can view own vehicles"
  on public.vehicles for select
  using (auth.uid() = user_id);

create policy "Users can insert own vehicles"
  on public.vehicles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vehicles"
  on public.vehicles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own vehicles"
  on public.vehicles for delete
  using (auth.uid() = user_id);

create trigger update_vehicles_updated_at before update on public.vehicles
  for each row execute function public.update_updated_at_column();

-- Create other_assets table
create table public.other_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  asset_name text not null,
  category text not null check (category in ('Cryptocurrency', 'Precious Metals', 'Collectibles', 'Art', 'Jewelry', 'Antiques', 'Other')),
  purchase_price numeric(15,2) not null,
  current_value numeric(15,2) not null,
  purchase_date date,
  quantity numeric(15,4),
  currency text default 'THB',
  description text,
  status text default 'active' check (status in ('active', 'sold', 'archived')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.other_assets enable row level security;

create policy "Users can view own other assets"
  on public.other_assets for select
  using (auth.uid() = user_id);

create policy "Users can insert own other assets"
  on public.other_assets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own other assets"
  on public.other_assets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own other assets"
  on public.other_assets for delete
  using (auth.uid() = user_id);

create trigger update_other_assets_updated_at before update on public.other_assets
  for each row execute function public.update_updated_at_column();
