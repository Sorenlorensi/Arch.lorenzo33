-- Execute DEPOIS do schema.sql (textos, cores e imagens do site)
create table site_settings (
  key text primary key check (key ~ '^[a-z0-9_]{1,40}$'),
  value text not null check (length(value) <= 2000),
  check (key not like 'color\_%' or value ~ '^#[0-9a-fA-F]{6}$')
);
alter table site_settings enable row level security;
create policy "ler config" on site_settings for select using (true);
create policy "admin escreve config" on site_settings for all using (is_admin()) with check (is_admin());
