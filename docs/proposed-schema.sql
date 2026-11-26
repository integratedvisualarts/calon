-- Calon: PROPOSED database schema (PostgreSQL).
-- NOT WIRED IN. The exported app has no database; this is a starting point that mirrors
-- the engine's types in src/engine/types.ts so real data can replace the simulation.

create table restaurants (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,            -- e.g. 'chai-social'
  name          text not null,
  type          text not null,
  cuisine       text not null,
  address       text not null,
  phone         text,
  email         text,
  tags          text[] not null default '{}',    -- drives opportunity fit
  hours         jsonb not null,                  -- {"lunch":{"open":720,"close":900},"dinner":{...}}
  tables        int not null default 0,
  seats         int not null default 0,
  plan          text not null default 'plus' check (plan in ('plus','pro')),
  created_at    timestamptz not null default now()
);

create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  name          text,
  created_at    timestamptz not null default now()
);

create table memberships (
  user_id       uuid references users(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  role          text not null default 'owner' check (role in ('owner','manager','calon_team')),
  primary key (user_id, restaurant_id)
);

create table menu_items (
  id            text not null,                   -- engine item id
  restaurant_id uuid references restaurants(id) on delete cascade,
  name          text not null,
  price         numeric(8,2) not null,
  price_verified boolean not null default false,
  course        text not null check (course in ('drink','starter','main','side')),
  veg           boolean not null default false,
  primary key (restaurant_id, id)
);

create table rota (
  restaurant_id uuid references restaurants(id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6),
  floor         smallint not null,
  kitchen       smallint not null,
  primary key (restaurant_id, weekday)
);

create table orders (
  id            text not null,                   -- POS order id
  restaurant_id uuid references restaurants(id) on delete cascade,
  day           date not null,
  seated_at     timestamptz not null,
  closed_at     timestamptz not null,
  service       text not null check (service in ('lunch','dinner')),
  channel       text not null check (channel in ('dine-in','deliveroo','uber','justeat')),
  covers        int not null default 0,
  booked        boolean not null default false,
  total         numeric(10,2) not null,
  source        text not null default 'csv',     -- csv | square | ...
  primary key (restaurant_id, id)
);
create index orders_by_day on orders (restaurant_id, day);

create table order_lines (
  restaurant_id uuid not null,
  order_id      text not null,
  item_id       text not null,
  qty           int not null,
  unit_price    numeric(8,2) not null,
  foreign key (restaurant_id, order_id) references orders(restaurant_id, id) on delete cascade
);

create table reviews (
  id            text not null,
  restaurant_id uuid references restaurants(id) on delete cascade,
  source        text not null check (source in ('Google','Tripadvisor')),
  author        text,
  stars         smallint not null check (stars between 1 and 5),
  posted_at     timestamptz not null,
  text          text not null,
  replied_at    timestamptz,
  reply         text,
  primary key (restaurant_id, id)
);

create table calendar_entries (
  id            text primary key,
  restaurant_id uuid references restaurants(id) on delete cascade,  -- null = shared
  name          text not null,
  kind          text not null check (kind in ('festival','event','campus','payday','season')),
  starts_on     date not null,
  ends_on       date,
  tags          text[] not null default '{}',
  lift          numeric(5,3) not null default 0,
  service       text not null default 'day',
  miles         numeric(5,2),
  source        text not null,
  provisional   boolean not null default false
);

create table presence_checks (
  restaurant_id uuid references restaurants(id) on delete cascade,
  check_id      text not null,                   -- e.g. 'hours-consistent', 'faq'
  level         numeric(3,2) not null check (level between 0 and 1),
  checked_at    timestamptz not null default now(),
  primary key (restaurant_id, check_id, checked_at)
);

create table campaigns (
  id            text not null,
  restaurant_id uuid references restaurants(id) on delete cascade,
  title         text not null,
  status        text not null check (status in ('draft','awaiting','scheduled','live','team','done')),
  source_id     text,                             -- opportunity or fix id
  audience      text,
  timing        text,
  channels      jsonb not null default '[]',
  content       jsonb not null default '{}',
  approved_by   uuid references users(id),
  approved_at   timestamptz,
  created_at    timestamptz not null default now(),
  primary key (restaurant_id, id)
);

-- Every approval is recorded: nothing goes out without one.
create table approvals (
  id            bigserial primary key,
  restaurant_id uuid not null,
  campaign_id   text not null,
  user_id       uuid references users(id),
  action        text not null check (action in ('approve','reject','send_to_team')),
  at            timestamptz not null default now()
);
