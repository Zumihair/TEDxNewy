/** Which programme motif an event wears. Salons and programmes are told apart by motif, not by colour. */
export type Motif = "network" | "waves" | "scribble";

export function motifFor(e: { slug?: string | null; title?: string | null; kind?: string | null }): Motif | undefined {
  const s = `${e.slug ?? ""} ${e.title ?? ""}`.toLowerCase();
  if (/youth|future[s]?[ -]lab/.test(s)) return "scribble";
  if (/60|sixty|talk night/.test(s)) return "waves";
  if (/2050|salon/.test(s) || e.kind === "salon") return "network";
  return undefined;
}
