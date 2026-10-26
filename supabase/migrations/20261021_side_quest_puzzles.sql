-- Signal Side Quest: real hidden QR puzzles. Created 2026-10-21.
-- Replaces the placeholder prompts and answers seeded in 20261006_side_quest.sql.
-- Answers match ignoring case, spaces and punctuation; a pipe lists alternatives.

update public.side_quest_challenges set
  puzzle_prompt = 'Who is this concert hall named after?',
  puzzle_answer = 'Harold Lobb|Harold Francis Lobb'
where id = 'discover_1';

update public.side_quest_challenges set
  puzzle_prompt = 'When was TED founded?',
  puzzle_answer = '1984'
where id = 'discover_2';

update public.side_quest_challenges set
  puzzle_prompt = 'What does the ''D'' in TED stand for?',
  puzzle_answer = 'Design'
where id = 'discover_3';
