-- Applied to the shared abonnement project on 2026-10-17. Only vocabulary data is touched.
alter table public.vocab_words add column if not exists personal_example text not null default '';
