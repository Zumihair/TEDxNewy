import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Editorial markdown renderer used by /ideas/[slug] and the admin live
 * preview. Styled to fit the cream + ink editorial language.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-tedx">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2
              className="mt-12 mb-5 font-sans tracking-[-0.02em] text-[#141210]"
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                lineHeight: 1.15,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="mt-9 mb-4 font-sans tracking-[-0.015em] text-[#141210]"
              style={{
                fontSize: "clamp(1.25rem, 2.4vw, 1.5rem)",
                lineHeight: 1.2,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 96',
              }}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mt-5 text-[17px] leading-[1.75] text-[#2a2521] md:text-[18px]">
              {children}
            </p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noreferrer" : undefined}
              className="underline decoration-[#e02214]/40 underline-offset-2 hover:text-[#e02214] hover:decoration-[#e02214]"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mt-5 list-disc space-y-2 pl-6 text-[16.5px] leading-[1.7] text-[#2a2521] marker:text-[#e02214]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-5 list-decimal space-y-2 pl-6 text-[16.5px] leading-[1.7] text-[#2a2521] marker:text-[#e02214]">
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="my-7 border-l-[3px] border-[#e02214] pl-5 font-sans italic tracking-[-0.005em] text-[#141210]"
              style={{
                fontSize: "clamp(1.15rem, 2vw, 1.35rem)",
                lineHeight: 1.5,
                fontWeight: 400,
                fontVariationSettings: '"opsz" 96',
              }}
            >
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-[rgba(20,18,16,0.06)] px-1.5 py-0.5 font-mono text-[14px] text-[#141210]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-6 overflow-x-auto rounded-[var(--radius-md)] bg-[#141210] p-5 font-mono text-[13px] leading-[1.55] text-[#f4efe6]">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-10 border-[rgba(20,18,16,0.10)]" />,
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => (
            <span className="my-7 block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src as string}
                alt={alt ?? ""}
                className="w-full rounded-[var(--radius-md)]"
                loading="lazy"
              />
              {alt && (
                <span className="mt-3 block text-center text-[12.5px] text-[#6b6459]">
                  {alt}
                </span>
              )}
            </span>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
