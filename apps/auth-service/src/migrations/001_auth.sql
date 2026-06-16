create table if not exists auth_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists auth_refresh_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth_users(id) on delete cascade,
  family_id uuid not null,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  replaced_by_session_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_refresh_active_user on auth_refresh_sessions(user_id) where revoked_at is null;
create index if not exists idx_auth_refresh_family on auth_refresh_sessions(family_id);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  action text not null,
  user_id uuid,
  correlation_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
