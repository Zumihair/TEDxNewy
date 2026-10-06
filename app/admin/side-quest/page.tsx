import { requireFullAdmin } from "@/lib/cms-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { isNotSetUp, namesReady, PRIZE_THRESHOLD } from "@/lib/side-quest";
import { Card, NotSetUp, PageHeader, SectionLabel } from "../ui";
import { THEMES } from "../section-theme";
import SideQuestAdmin, {
  type AdminChallenge,
  type AdminDraw,
  type AdminPhoto,
  type AdminSessionRow,
} from "./SideQuestAdmin";

export const dynamic = "force-dynamic";

const coast = THEMES.coast; // Side Quest sits in Management.

/** Page through a table, since PostgREST stops at 1000 rows a request. */
async function fetchAll<T>(
  table: string,
  select: string,
  order: string,
): Promise<{ rows: T[]; error: { code?: string } | null }> {
  const db = getAdminSupabase();
  const rows: T[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from(table)
      .select(select)
      .order(order, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { rows, error };
    rows.push(...((data ?? []) as unknown as T[]));
    if (!data || data.length < PAGE) break;
  }
  return { rows, error: null };
}

const fullName = (first: string, last?: string | null) =>
  [first, last].filter(Boolean).join(" ");

type SessionDb = {
  id: string;
  first_name: string;
  last_name?: string;
  score: number;
  prize_eligible: boolean;
  eligible_at: string | null;
  created_at: string;
};

type PhotoDb = {
  id: string;
  session_id: string;
  challenge_id: string;
  url: string;
  thumb_url: string;
  uploaded_at: string;
  approved: boolean;
};

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default async function SideQuestAdminPage() {
  await requireFullAdmin();
  // Last names exist only once 20261008_side_quest_names.sql is applied.
  const hasNames = await namesReady();

  const [
    challengesRes,
    sessionsRes,
    completionsRes,
    photosRes,
    attemptsRes,
    drawsRes,
  ] = await Promise.all([
      fetchAll<AdminChallenge & { sort: number }>(
        "side_quest_challenges",
        "id, title, description, category, type, points, sort, active, qr_number, puzzle_prompt",
        "sort",
      ),
      fetchAll<SessionDb>(
        "side_quest_sessions",
        hasNames
          ? "id, first_name, last_name, score, prize_eligible, eligible_at, created_at"
          : "id, first_name, score, prize_eligible, eligible_at, created_at",
        "created_at",
      ),
      fetchAll<{ session_id: string; challenge_id: string }>(
        "side_quest_completions",
        "session_id, challenge_id",
        "completed_at",
      ),
      fetchAll<PhotoDb>(
        "side_quest_photos",
        "id, session_id, challenge_id, url, thumb_url, uploaded_at, approved",
        "uploaded_at",
      ),
      fetchAll<{ challenge_id: string; correct: boolean }>(
        "side_quest_qr_attempts",
        "challenge_id, correct",
        "at",
      ),
      fetchAll<{
        id: number;
        session_id: string;
        first_name: string;
        last_name?: string;
        score: number;
        eligible_at: string | null;
        drawn_at: string;
        status: "winner" | "skipped";
      }>(
        "side_quest_draws",
        hasNames
          ? "id, session_id, first_name, last_name, score, eligible_at, drawn_at, status"
          : "id, session_id, first_name, score, eligible_at, drawn_at, status",
        "id",
      ),
    ]);

  // The draw table comes from a later migration than the rest, so a missing
  // table only disables the draw, not the whole page.
  const drawSetUp = !isNotSetUp(drawsRes.error);
  const draws: AdminDraw[] = drawSetUp
    ? drawsRes.rows.map((d) => ({
        id: d.id,
        sessionId: d.session_id,
        name: fullName(d.first_name, d.last_name),
        status: d.status,
      }))
    : [];

  const notSetUp = [
    challengesRes,
    sessionsRes,
    completionsRes,
    photosRes,
    attemptsRes,
  ].some((r) => isNotSetUp(r.error));

  const header = (
    <PageHeader
      eyebrow="Side Quest"
      title="Signal Side Quest"
      description="The intermission game: scores, the prize draw, the photo wall and the quest list. Players need no account, just a first name."
    />
  );

  if (notSetUp) {
    return (
      <div className="space-y-8">
        {header}
        <NotSetUp title="Side Quest isn't set up yet">
          The database update for Side Quest (20261006_side_quest.sql)
          hasn&rsquo;t been applied. Ask Will to run it in the Supabase SQL
          editor, then reload this page.
        </NotSetUp>
      </div>
    );
  }

  const challenges = challengesRes.rows;
  const sessions = sessionsRes.rows;
  const nameById = new Map(
    sessions.map((s) => [s.id, fullName(s.first_name, s.last_name)]),
  );
  const titleById = new Map(challenges.map((c) => [c.id, c.title]));

  // Per challenge completion counts.
  const completedBy = new Map<string, number>();
  const photosBySession = new Map<string, number>();
  for (const c of completionsRes.rows) {
    completedBy.set(c.challenge_id, (completedBy.get(c.challenge_id) ?? 0) + 1);
  }
  for (const p of photosRes.rows) {
    photosBySession.set(p.session_id, (photosBySession.get(p.session_id) ?? 0) + 1);
  }
  const attempts = new Map<string, { right: number; wrong: number }>();
  for (const a of attemptsRes.rows) {
    const cur = attempts.get(a.challenge_id) ?? { right: 0, wrong: 0 };
    if (a.correct) cur.right += 1;
    else cur.wrong += 1;
    attempts.set(a.challenge_id, cur);
  }

  const scores = sessions.map((s) => s.score).sort((a, b) => a - b);
  const reached = sessions.filter((s) => s.score >= PRIZE_THRESHOLD).length;
  const stats = {
    sessions: sessions.length,
    reached,
    average: scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0,
    median: median(scores),
    max: scores.length ? scores[scores.length - 1] : 0,
    photos: photosRes.rows.length,
    visiblePhotos: photosRes.rows.filter((p) => p.approved).length,
  };

  const perChallenge = challenges.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    count: completedBy.get(c.id) ?? 0,
    right: attempts.get(c.id)?.right ?? 0,
    wrong: attempts.get(c.id)?.wrong ?? 0,
  }));

  const prizeRows: AdminSessionRow[] = sessions
    .filter((s) => s.prize_eligible)
    .sort(
      (a, b) =>
        new Date(a.eligible_at ?? a.created_at).getTime() -
        new Date(b.eligible_at ?? b.created_at).getTime(),
    )
    .map((s) => ({
      id: s.id,
      shortId: s.id.slice(0, 8),
      firstName: s.first_name,
      lastName: s.last_name ?? "",
      score: s.score,
      eligibleAt: s.eligible_at,
      photoCount: photosBySession.get(s.id) ?? 0,
    }));

  const photos: AdminPhoto[] = [...photosRes.rows]
    .reverse()
    .map((p) => ({
      id: p.id,
      thumbUrl: p.thumb_url,
      url: p.url,
      uploadedAt: p.uploaded_at,
      name: nameById.get(p.session_id) ?? "",
      quest: titleById.get(p.challenge_id) ?? p.challenge_id,
      hidden: !p.approved,
    }));

  return (
    <div className="space-y-10">
      {header}

      {!hasNames && (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(0,0,0,0.18)] bg-[#f4efe6] px-5 py-4 text-[13.5px] leading-[1.6] text-[#4a453d]">
          Last names aren&rsquo;t being stored separately yet, and duplicate
          names aren&rsquo;t blocked. Ask Will to run the database update
          (20261008_side_quest_names.sql), then reload this page. Players
          still give a first and last name in the meantime.
        </div>
      )}

      <section className="space-y-3">
        <SectionLabel>Right now</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Players", value: String(stats.sessions) },
            {
              label: `Reached ${PRIZE_THRESHOLD} points`,
              value: String(stats.reached),
            },
            { label: "Average score", value: stats.average.toFixed(1) },
            { label: "Median score", value: String(stats.median) },
            { label: "Top score", value: String(stats.max) },
            { label: "Photos", value: String(stats.photos) },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[var(--radius-md)] border bg-white px-4 py-3.5"
              style={{ borderColor: coast.border }}
            >
              <div
                className="font-sans text-[26px] font-medium leading-none tracking-[-0.02em] tabular-nums text-[#000000]"
              >
                {s.value}
              </div>
              <div className="mt-1.5 text-[12px] text-[#6b6459]">{s.label}</div>
            </div>
          ))}
        </div>
        <Card>
          <ul className="divide-y divide-[rgba(0,0,0,0.08)]">
            {perChallenge.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-[13.5px] md:px-5"
              >
                <span className="font-medium text-[#000000]">{c.title}</span>
                <span className="text-[#4a453d]">
                  {c.count} done
                  {c.type === "qr" &&
                    ` · ${c.right} correct, ${c.wrong} wrong tries`}
                </span>
              </li>
            ))}
            {perChallenge.length === 0 && (
              <li className="px-5 py-8 text-center text-[13.5px] text-[#6b6459]">
                No quests yet.
              </li>
            )}
          </ul>
        </Card>
      </section>

      <SideQuestAdmin
        prizeRows={prizeRows}
        draws={draws}
        drawSetUp={drawSetUp}
        photos={photos}
        challenges={challenges}
        threshold={PRIZE_THRESHOLD}
      />
    </div>
  );
}
