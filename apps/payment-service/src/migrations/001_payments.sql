create table if not exists payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  seat_id uuid not null,
  hold_id uuid not null,
  amount_cents integer not null,
  currency text not null default 'USD',
  status text not null check (status in ('pending', 'completed', 'failed')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_intents_hold on payment_intents(hold_id);
create index if not exists idx_payment_intents_status on payment_intents(status) where status = 'pending';

create table if not exists payment_webhook_events (
  event_id uuid primary key,
  payment_intent_id uuid not null references payment_intents(id),
  event_type text not null,
  signature_timestamp timestamptz not null,
  processed_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  action text not null,
  user_id uuid,
  correlation_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
