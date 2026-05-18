-- Marqueur "cet exemple a été réécrit (copyright safety)".
-- Permet à scripts/rewrite_examples.py --only-missing de skip ce qui est déjà fait.

alter table public.examples
  add column rewritten_at timestamptz;

comment on column public.examples.rewritten_at is
  'Timestamp du dernier passage de scripts/rewrite_examples.py. null = non réécrit.';
