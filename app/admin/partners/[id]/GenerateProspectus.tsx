import { ExternalLink } from "lucide-react";
import { SecondaryButton } from "../../ui";

/**
 * The personalised prospectus, as a plain HTML page opened in a new tab
 * (their name on the cover, their suggested tier highlighted). A partner or
 * a browser's own "Save as PDF" can turn it into a file when one's wanted.
 * There used to also be a server-rendered PDF via headless Chromium; that
 * was dropped (2026-08) after it proved unreliable in production and this
 * link did everything it needed to anyway.
 */
export default function GenerateProspectus({ partnerId }: { partnerId: string }) {
  return (
    <a
      href={`/api/admin/partners/${partnerId}/prospectus`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <SecondaryButton type="button">
        <ExternalLink className="h-4 w-4" strokeWidth={2.25} />
        Open prospectus
      </SecondaryButton>
    </a>
  );
}
