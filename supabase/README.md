# Supabase migrations (TEDxNewy)

Project ref: `gurlrjlesdbiqxhavwil`. It is NOT in Will's Supabase org, so the
claude.ai Supabase MCP cannot see it until it is authorised with the account
that owns it (or Will is invited to that org).

## Workflow
1. Add a new SQL file in `supabase/migrations/` named `YYYYMMDDHHMMSS_name.sql`
   (14-digit prefix, unique). Write it re-runnable (`if not exists`, `drop policy if exists`).
2. Apply it with ONE of:
   - MCP `apply_migration` (once the MCP can see the project), or
   - `supabase db push` (CLI, after the one-time setup below).
3. Never commit tokens, DB passwords or keys. Use `SUPABASE_ACCESS_TOKEN` and
   `SUPABASE_DB_PASSWORD` as env vars only.

## One-time CLI setup (Will)
    npm i -g supabase            (or: scoop install supabase)
    supabase login               (or set SUPABASE_ACCESS_TOKEN from the owning account)
    supabase link --project-ref gurlrjlesdbiqxhavwil
    supabase migration list      (compare Local vs Remote)

## Legacy files
The 64 existing files use 8-digit date prefixes (some duplicated, e.g. two
`20260811_*`), and were applied by hand, so the remote history table is empty
or partial. Before the first `db push`, either mark them applied:
    supabase migration repair --status applied <version>
or rename them to unique 14-digit versions first. Do this before pushing, or
the CLI will try to re-run everything.
