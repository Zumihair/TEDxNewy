import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";
import { OG_PAGES } from "@/lib/og-content";

const PAGE = OG_PAGES["/signature"];

export const alt = PAGE.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OG() {
  return renderOgCard(PAGE);
}
