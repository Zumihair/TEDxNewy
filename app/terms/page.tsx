import PageHero from "@/components/PageHero";
import { ORG } from "@/lib/data";

export const metadata = {
  title: "Terms · TEDxNewy",
  description:
    "Terms of use for the TEDxNewy website and event participation.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        kicker="Terms"
        titleTop="The fine print, plain-English."
        intro={
          <>
            By using this site or attending a TEDxNewy event, you agree to the
            terms below. They&rsquo;re short, common-sense, and exist to
            protect the volunteers running the show as much as our audience.
          </>
        }
      />

      <section className="mx-auto max-w-[680px] px-5 pb-24 md:px-6 md:pb-32">
        <div className="space-y-10 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              Who runs this site
            </h2>
            <p className="mt-3">
              The TEDxNewy website is operated by{" "}
              <strong>{ORG.legalName}</strong> (ACN {ORG.acn}), a
              not-for-profit volunteer-run organisation in Newcastle, Australia.
              {" "}{ORG.licence}
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              Use of the site
            </h2>
            <p className="mt-3">
              You can browse, share links, and submit forms freely. We ask that
              you don&rsquo;t scrape, crawl, or reuse our content
              programmatically without checking with us first &mdash;
              <a
                href={`mailto:${ORG.email}`}
                className="ml-1 text-[#e02214] underline-offset-4 hover:underline"
              >
                {ORG.email}
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              Talk videos
            </h2>
            <p className="mt-3">
              Talks delivered at TEDxNewy events are recorded and published
              under the TED licence on YouTube. Speakers retain authorship of
              their talks; we and TED hold a non-exclusive licence to publish
              and share them.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              Event attendance
            </h2>
            <p className="mt-3">
              By attending a TEDxNewy event you agree to our{" "}
              <a href="/code-of-conduct" className="text-[#e02214] underline-offset-4 hover:underline">
                Code of Conduct
              </a>
              . Tickets are non-transferable without prior arrangement.
              We reserve the right to refuse entry or remove anyone in breach
              of the Code without refund. If a Salon or main-stage event is
              cancelled or postponed, we&rsquo;ll honour ticket holders for the
              rescheduled date or refund &mdash; we&rsquo;ll let you know which.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              Photography &amp; recording
            </h2>
            <p className="mt-3">
              We professionally record talks for YouTube and shoot photography
              throughout events. By attending, you consent to incidental
              capture in audience shots. Opt-out details are on our{" "}
              <a href="/code-of-conduct" className="text-[#e02214] underline-offset-4 hover:underline">
                Code of Conduct
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              Liability
            </h2>
            <p className="mt-3">
              We do our best to keep this site accurate and our events safely
              run, but we make no warranties beyond what Australian Consumer
              Law guarantees. To the extent permitted by law, our liability is
              limited to the price of any ticket purchased.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              Changes
            </h2>
            <p className="mt-3">
              We may update these terms. The current version will always live
              at this URL. Material changes will be highlighted in our newsletter.
            </p>
            <p className="mt-3 text-[13px] text-[#6b6459]">
              Last updated: {new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
