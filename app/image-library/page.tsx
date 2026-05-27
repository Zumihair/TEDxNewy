import fs from "node:fs";
import path from "node:path";

export const metadata = {
  title: "Image Library (internal)",
  robots: { index: false, follow: false },
};

const IMAGE_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".svg",
]);

type Img = { src: string; name: string; folder: string; sizeKB: number };

function collectImages(): Img[] {
  const publicDir = path.join(process.cwd(), "public");
  let rels: string[] = [];
  try {
    rels = (fs.readdirSync(publicDir, { recursive: true }) as string[]).map(
      (e) => e.split(path.sep).join("/"),
    );
  } catch {
    return [];
  }
  return rels
    .filter((rel) => IMAGE_EXTS.has(path.extname(rel).toLowerCase()))
    .map((rel) => {
      let sizeKB = 0;
      try {
        sizeKB = Math.round(fs.statSync(path.join(publicDir, rel)).size / 1024);
      } catch {}
      const parts = rel.split("/");
      return {
        src: "/" + rel,
        name: parts[parts.length - 1],
        folder: parts.length > 1 ? parts.slice(0, -1).join("/") : "(root)",
        sizeKB,
      };
    })
    .sort((a, b) => a.src.localeCompare(b.src));
}

export default function ImageLibraryPage() {
  const images = collectImages();
  const groups = new Map<string, Img[]>();
  for (const img of images) {
    if (!groups.has(img.folder)) groups.set(img.folder, []);
    groups.get(img.folder)!.push(img);
  }
  const sortedGroups = [...groups.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  // Subtle checkerboard so transparent PNGs are easy to read.
  const checker = {
    backgroundImage:
      "linear-gradient(45deg, #ddd6c8 25%, transparent 25%), linear-gradient(-45deg, #ddd6c8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd6c8 75%), linear-gradient(-45deg, transparent 75%, #ddd6c8 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
    backgroundColor: "#f0ebe0",
  };

  return (
    <div className="min-h-screen bg-[#f4efe6] px-6 pb-24 pt-28 md:px-10 md:pt-32">
      <div className="mx-auto max-w-[1280px]">
        <div
          className="text-[10.5px] font-semibold uppercase text-[#e02214]"
          style={{ letterSpacing: "0.24em" }}
        >
          Internal · not linked publicly
        </div>
        <h1
          className="mt-4 font-sans tracking-[-0.025em] text-[#141210]"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 500 }}
        >
          Image Library
        </h1>
        <p className="mt-3 text-[15px] text-[#6b6459]">
          {images.length} images in <code>/public</code>. Each caption shows the
          path you&rsquo;d use in code (e.g. <code>image=&quot;/images/...&quot;</code>).
        </p>

        {sortedGroups.map(([folder, imgs]) => (
          <section key={folder} className="mt-14">
            <h2 className="flex items-baseline gap-3 border-b border-[rgba(20,18,16,0.12)] pb-3 font-mono text-[13px] font-semibold uppercase tracking-[0.16em] text-[#141210]">
              {folder}
              <span className="text-[#9a9286]">{imgs.length}</span>
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {imgs.map((img) => (
                <figure
                  key={img.src}
                  className="overflow-hidden rounded-xl border border-[rgba(20,18,16,0.10)] bg-white"
                >
                  <div
                    className="flex aspect-[4/3] items-center justify-center"
                    style={checker}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={img.name}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <figcaption className="px-3 py-2.5">
                    <div className="truncate text-[13px] font-medium text-[#141210]">
                      {img.name}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <code className="truncate text-[11px] text-[#6b6459]">
                        {img.src}
                      </code>
                      <span className="shrink-0 text-[11px] text-[#9a9286]">
                        {img.sizeKB} KB
                      </span>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
