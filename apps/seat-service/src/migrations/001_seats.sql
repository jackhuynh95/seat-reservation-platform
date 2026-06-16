create table if not exists seats (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  status text not null check (status in ('available', 'held', 'reserved')) default 'available',
  reserved_by_user_id uuid,
  reserved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists seat_holds (
  id uuid primary key default gen_random_uuid(),
  seat_id uuid not null references seats(id) on delete cascade,
  user_id uuid not null,
  status text not null check (status in ('held', 'expired', 'released', 'reserved')) default 'held',
  expires_at timestamptz not null,
  payment_intent_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_one_active_hold_per_seat on seat_holds(seat_id) where status = 'held';
create unique index if not exists ux_one_active_hold_per_user on seat_holds(user_id) where status = 'held';
create index if not exists idx_seat_holds_expiry on seat_holds(expires_at) where status = 'held';
create index if not exists idx_seats_status_hot_path on seats(status) where status in ('held', 'reserved');

create table if not exists seat_reservations (
  id uuid primary key default gen_random_uuid(),
  seat_id uuid not null references seats(id),
  hold_id uuid not null unique references seat_holds(id),
  user_id uuid not null,
  payment_intent_id uuid not null unique,
  created_at timestamptz not null default now()
);

create table if not exists processed_payment_events (
  event_id uuid primary key,
  event_type text not null,
  payment_intent_id uuid not null,
  processed_at timestamptz not null default now()
);

insert into seats(label)
values ('A1'), ('A2'), ('A3')
on conflict (label) do nothing;
