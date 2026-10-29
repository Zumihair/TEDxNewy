-- Role-specific application forms. A role carries its
-- own questions; an application keeps its answers
-- (question wording + answer, so it reads after edits).
-- Replaces apply_question (kept, no longer read).
-- Safe to re-run. No drop statements on purpose.

alter table public.volunteer_roles
  add column if not exists questions jsonb
  not null default '[]'::jsonb;

alter table public.applications
  add column if not exists answers jsonb;

-- Partnerships manager's questions, only if it has none.
update public.volunteer_roles
set questions = jsonb_build_array(
  jsonb_build_object(
    'id', 'now', 'type', 'short', 'required', true,
    'label', 'What do you do now?',
    'hint', 'Your current role and where, '
      || 'or what you are studying.'),
  jsonb_build_object(
    'id', 'linkedin', 'type', 'link', 'required', false,
    'label', 'LinkedIn profile'),
  jsonb_build_object(
    'id', 'relationship', 'type', 'long',
    'required', true,
    'label', 'Tell us about a partnership or client '
      || 'relationship you have built or looked '
      || 'after. What made it work?'),
  jsonb_build_object(
    'id', 'doors', 'type', 'long', 'required', false,
    'label', 'Which businesses or organisations in '
      || 'Newcastle and the Hunter could you '
      || 'open a door to?'),
  jsonb_build_object(
    'id', 'time', 'type', 'choice', 'required', true,
    'label', 'Can you give a few hours a week '
      || 'through the 2027 season?',
    'options', jsonb_build_array(
      'Yes', 'Most weeks',
      'Not sure yet, happy to chat')),
  jsonb_build_object(
    'id', 'else', 'type', 'long', 'required', false,
    'label', 'Anything else we should know?')
)
where slug = 'partnerships-manager'
  and questions = '[]'::jsonb;
