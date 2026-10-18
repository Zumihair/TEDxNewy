import Link from "next/link";
import { Icon } from "@/components/ds";

export type TileDoc = { id: string; title: string; file_url: string; category?: string | null };
export type TilePhoto = { id: string; url: string; thumb_url: string | null };

/** The Resources overview: a graphic tile for each of logos, documents, templates and images. */
export default function ResourcesTiles({ docs, recent }: { docs: TileDoc[]; recent: TilePhoto[] }) {
  return (
    <div className="adm-restiles">
      <Link href="/admin/brand" className="adm-restile">
        <div className="adm-restile__art adm-restile__art--logos">
          <span className="adm-rl" style={{ background: "#f4efe6" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockups/TEDxNewy-Standard-black.png" alt="" style={{ height: 22 }} />
          </span>
          <span className="adm-rl" style={{ background: "#000" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockups/TEDxNewy-Standard-white.png" alt="" style={{ height: 22 }} />
          </span>
          <span className="adm-rl" style={{ background: "#e62b1e" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockups/TEDxNewy-Standard-mono.png" alt="" style={{ height: 22 }} />
          </span>
          <span className="adm-rl" style={{ background: "#fff", boxShadow: "inset 0 0 0 1px var(--line)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockups/TEDxNewy-X-red.png" alt="" style={{ height: 34 }} />
          </span>
        </div>
        <div className="adm-restile__foot">
          <span className="adm-restile__text">
            <span className="adm-card__title">Logos and branding</span>
            <span className="adm-card__text">Logos, tagline, colours and fonts</span>
          </span>
          <Icon name="arrow-right" size={18} />
        </div>
      </Link>
  
      <Link href="/admin/documents" className="adm-restile">
        <div className="adm-restile__art adm-restile__art--docs">
          {docs.length === 0 ? (
            <span className="adm-card__text">No documents yet.</span>
          ) : (
            docs.slice(0, 4).map((d) => (
              <span key={d.id} className="adm-docrow">
                <span className="adm-docrow__badge">{(d.file_url.split("?")[0].split(".").pop() || "file").slice(0, 4).toUpperCase()}</span>
                <span className="adm-docrow__title">{d.title}</span>
                <span className="adm-docrow__cat">{d.category ?? "General"}</span>
              </span>
            ))
          )}
        </div>
        <div className="adm-restile__foot">
          <span className="adm-restile__text">
            <span className="adm-card__title">Documents</span>
            <span className="adm-card__text">Reports, decks and files with a public link</span>
          </span>
          <Icon name="arrow-right" size={18} />
        </div>
      </Link>
  
      <Link href="/admin/brand/templates" className="adm-restile">
        <div className="adm-restile__art adm-restile__art--tpls">
          <span className="adm-tp adm-tp--page">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockups/TEDxNewy-Standard-black.png" alt="" />
            <i /><i /><i /><i style={{ width: "60%" }} />
          </span>
          <span className="adm-tp adm-tp--card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockups/TEDxNewy-Standard-mono.png" alt="" />
          </span>
          <span className="adm-tp adm-tp--slide">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockups/TEDxNewy-X-white.png" alt="" />
          </span>
        </div>
        <div className="adm-restile__foot">
          <span className="adm-restile__text">
            <span className="adm-card__title">Templates</span>
            <span className="adm-card__text">Letterhead, cards, signature, banners and slides</span>
          </span>
          <Icon name="arrow-right" size={18} />
        </div>
      </Link>
  
      <Link href="/admin/images" className="adm-restile">
        <div className="adm-restile__art adm-restile__art--photos">
          {recent.length === 0 ? (
            <span className="adm-card__text">No photos yet.</span>
          ) : (
            recent.slice(0, 6).map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={p.thumb_url || p.url} alt="" loading="lazy" />
            ))
          )}
        </div>
        <div className="adm-restile__foot">
          <span className="adm-restile__text">
            <span className="adm-card__title">Images</span>
            <span className="adm-card__text">The event photo library</span>
          </span>
          <Icon name="arrow-right" size={18} />
        </div>
      </Link>
    </div>
  
  );
}
