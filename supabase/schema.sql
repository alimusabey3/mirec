-- MIREC Stüdyo — Supabase şeması
-- Kurulum: Supabase panelinde SQL Editor'e yapıştır ve çalıştır.
-- Ardından .env.local dosyasına proje URL + anon key ekle.

-- ---------- Tablolar ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  genre text not null default 'pol',
  timeline jsonb,
  screenplay jsonb,
  created_at timestamptz not null default now()
);

-- Şemayı daha önce çalıştıranlar için migrasyon:
alter table public.projects add column if not exists screenplay jsonb;

-- Karakterler kullanıcı seviyesinde bir cast kütüphanesidir (projeye bağlı değil);
-- hangi karakterin hangi yapımda oynadığı project_characters ile eşlenir.
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text,
  look text,
  style text,
  ref_image_url text,
  soul_id text,
  job_id text,
  job_model text,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists public.project_characters (
  project_id uuid not null references public.projects(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  primary key (project_id, character_id)
);

-- Şemayı daha önce çalıştıranlar için migrasyon:
alter table public.characters add column if not exists ref_image_url text;
alter table public.characters add column if not exists soul_id text;
alter table public.characters add column if not exists job_id text;
alter table public.characters add column if not exists job_model text;
-- Eski project_id bağlarını join tablosuna taşı, sonra kolonu kaldır.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'characters'
      and column_name = 'project_id'
  ) then
    insert into public.project_characters (project_id, character_id)
      select project_id, id from public.characters where project_id is not null
      on conflict do nothing;
    alter table public.characters drop column project_id;
  end if;
end $$;
drop index if exists public.idx_characters_project;

create table if not exists public.scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  prompt text,
  genre text,
  engine text,
  duration int not null default 5,
  status text not null default 'queued',
  video_url text,
  job_id text,
  job_model text,
  created_at timestamptz not null default now()
);

-- Şemayı daha önce çalıştıranlar için migrasyon:
alter table public.scenes add column if not exists job_id text;
alter table public.scenes add column if not exists job_model text;

create table if not exists public.audio_clips (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text not null,
  text text,
  voice text,
  duration int not null default 5,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

-- Bekleme listesi (landing waitlist) — yazma yalnız API route'un servis anahtarıyla.
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consent boolean not null default false,
  locale text not null default 'tr',
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;
-- Bilerek politika yok: anon/authenticated erişemez; service role RLS'i baypas eder.

-- ---------- Row Level Security ----------
alter table public.projects            enable row level security;
alter table public.characters          enable row level security;
alter table public.project_characters  enable row level security;
alter table public.scenes              enable row level security;
alter table public.audio_clips         enable row level security;

-- Her kullanıcı yalnız kendi satırlarını görür/değiştirir.
create policy "own_projects"   on public.projects    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_characters" on public.characters  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_scenes"     on public.scenes      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_audio"      on public.audio_clips for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- project_characters: yalnız projenin sahibi eşleme görebilir/değiştirebilir.
drop policy if exists "own_project_characters" on public.project_characters;
create policy "own_project_characters" on public.project_characters for all
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

-- ---------- İndeksler ----------
create index if not exists idx_characters_user       on public.characters(user_id);
create index if not exists idx_project_chars_char    on public.project_characters(character_id);
create index if not exists idx_scenes_project        on public.scenes(project_id);
create index if not exists idx_audio_project         on public.audio_clips(project_id);
