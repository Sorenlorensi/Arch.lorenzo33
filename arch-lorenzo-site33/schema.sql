-- Execute no SQL Editor do Supabase.
create table admin_users (email text primary key);
alter table admin_users enable row level security; -- sem policies: ninguém lê via API

create function is_admin() returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from admin_users where lower(email) = lower(auth.jwt()->>'email'))
$$;

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) <= 150),
  slug text unique not null,
  category text not null check (category in ('Residencial','Escritório','Comercial','Paisagismo')),
  location text, area text, year int,
  description text check (length(description) <= 5000),
  cover_url text, gallery text[] not null default '{}',
  published boolean not null default true,
  featured boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table projects enable row level security;
create policy "ver publicados" on projects for select using (published or is_admin());
create policy "admin escreve" on projects for all using (is_admin()) with check (is_admin());

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null, contact text not null,
  project_type text, location text, message text,
  deadline text, budget text,
  consent boolean not null,
  created_at timestamptz not null default now()
);
alter table leads enable row level security;
create policy "enviar lead" on leads for insert to anon, authenticated
  with check (consent = true and length(name) between 2 and 120 and length(contact) between 5 and 120
              and length(coalesce(message,'')) <= 2000);
create policy "admin lê leads" on leads for select using (is_admin());
create policy "admin apaga leads" on leads for delete using (is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('projects','projects',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy "imagens públicas" on storage.objects for select using (bucket_id = 'projects');
create policy "admin envia imagens" on storage.objects for insert with check (bucket_id='projects' and is_admin());
create policy "admin altera imagens" on storage.objects for update using (bucket_id='projects' and is_admin());
create policy "admin apaga imagens" on storage.objects for delete using (bucket_id='projects' and is_admin());

-- Depois de criar o usuário em Authentication > Users, autorize o e-mail:
-- insert into admin_users (email) values ('email-do-proprietario@exemplo.com');
