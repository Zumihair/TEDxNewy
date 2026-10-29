-- A role's own application question, asked on its
-- page (/volunteer/roles/<slug>) in place of the general
-- note. Optional. Safe to re-run.
alter table public.volunteer_roles
  add column if not exists apply_question text;

update public.volunteer_roles
  set apply_question = 'Tell us about a relationship '
    || 'with a business or organisation you have built '
    || 'or looked after, and what made it work.'
  where slug = 'partnerships-manager'
    and apply_question is null;
