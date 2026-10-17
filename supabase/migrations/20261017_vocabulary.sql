-- Migration Mot à Mot. Apply once in a dedicated Supabase project.
-- Authenticated users can only access their own vocabulary and review history.
create extension if not exists pgcrypto;
create table if not exists public.vocab_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  term text not null check (char_length(trim(term)) between 1 and 150),
  meaning text not null check (char_length(trim(meaning)) between 1 and 500),
  translation_ar text not null default '',
  example text not null default '',
  category text not null default 'Quotidien',
  source text not null default 'Personnel',
  learned_on date not null default current_date,
  created_at timestamptz not null default now(),
  due_at timestamptz not null default now(),
  interval_days numeric(10,5) not null default 0 check (interval_days >= 0),
  ease numeric(4,2) not null default 2.5 check (ease >= 1.3),
  reps integer not null default 0 check (reps >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  archived boolean not null default false
);
create table if not exists public.vocab_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.vocab_words(id) on delete cascade,
  rating text not null check (rating in ('again','hard','good','easy')),
  mode text not null default 'review' check (mode in ('review','practice')),
  reviewed_at timestamptz not null default now()
);
create index if not exists vocab_words_user_due_idx on public.vocab_words (user_id,due_at) where archived = false;
create index if not exists vocab_words_user_created_idx on public.vocab_words (user_id,created_at desc);
create index if not exists vocab_reviews_user_date_idx on public.vocab_reviews (user_id,reviewed_at desc);
create index if not exists vocab_reviews_word_idx on public.vocab_reviews (word_id);

alter table public.vocab_words enable row level security;
alter table public.vocab_reviews enable row level security;

create policy "vocab_words_select_own" on public.vocab_words for select to authenticated
using ((select auth.uid()) = user_id);
create policy "vocab_words_insert_own" on public.vocab_words for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "vocab_words_update_own" on public.vocab_words for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "vocab_words_delete_own" on public.vocab_words for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "vocab_reviews_select_own" on public.vocab_reviews for select to authenticated
using ((select auth.uid()) = user_id);
create policy "vocab_reviews_insert_own" on public.vocab_reviews for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.vocab_words w where w.id = word_id and w.user_id = (select auth.uid()))
);
create policy "vocab_reviews_delete_own" on public.vocab_reviews for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.vocab_words, public.vocab_reviews from anon;
grant select, insert, update, delete on public.vocab_words to authenticated;
grant select, insert, delete on public.vocab_reviews to authenticated;
