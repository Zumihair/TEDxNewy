import PageHero from "@/components/PageHero";
import { ORG } from "@/lib/data";

export const metadata = {
  title: "Code of Conduct · TEDxNewy",
  description:
    "How we expect everyone — speakers, audience, crew, partners — to show up at TEDxNewy events.",
};

export default function CodeOfConductPage() {
  return (
    <>
      <PageHero
        kicker="Code of conduct"
        titleTop="How we show up."
        intro={
          <>
            TEDxNewy events bring together speakers, audience, crew, partners
            and elders from across Newcastle. The code below is the floor &mdash;
            below it, we ask you to leave. Above it, we hope you make the room
            better.
          </>
        }
      />

      <section className="mx-auto max-w-[680px] px-5 pb-24 md:px-6 md:pb-32">
        <div className="space-y-10 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              1. Be respectful
            </h2>
            <p className="mt-3">
              No harassment, intimidation, or discrimination on the basis of
              race, ancestry, gender, sexual orientation, disability, age,
              religion, or any other protected attribute. This applies to
              speakers on stage, in the audience, in chat, in our DMs, and at
              the after-party. Disagreement is welcome; contempt is not.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              2. Be honest
            </h2>
            <p className="mt-3">
              Don&rsquo;t misrepresent yourself, your work, or anyone
              else&rsquo;s. If you cite research, cite it accurately. If
              you&rsquo;re selling something, say so. The TEDx licence requires
              that talks not be used to advance a sales pitch &mdash; we take
              that seriously.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              3. Recording &amp; photography
            </h2>
            <p className="mt-3">
              We professionally record talks for YouTube and capture
              photography during events. By attending, you consent to
              incidental capture in audience shots. If you&rsquo;d prefer not
              to be recorded or photographed, let our front-of-house crew know
              on the day, or email{" "}
              <a
                href={`mailto:${ORG.email}`}
                className="text-[#e02214] underline-offset-4 hover:underline"
              >
                {ORG.email}
              </a>{" "}
              ahead of time and we&rsquo;ll seat you accordingly.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              4. Reporting concerns
            </h2>
            <p className="mt-3">
              If you experience or witness a breach of this code, tell any
              crew member at the event &mdash; we&rsquo;ll be wearing TEDxNewy
              lanyards &mdash; or email{" "}
              <a
                href={`mailto:${ORG.email}`}
                className="text-[#e02214] underline-offset-4 hover:underline"
              >
                {ORG.email}
              </a>{" "}
              afterwards. Reports stay confidential to the organising
              committee. Anonymous reports are welcome and acted on.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              5. Enforcement
            </h2>
            <p className="mt-3">
              The organising committee may, without warning and without
              refund, ask anyone in breach to leave the event or step away
              from a programme. Serious breaches are escalated to the venue
              and, where applicable, to the police. We take care of each
              other here.
            </p>
          </div>

          <div className="border-t border-[rgba(20,18,16,0.10)] pt-8">
            <p className="text-[13px] text-[#6b6459]">
              Last updated: {new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}.
              Adapted from the TED community guidelines and made specific to
              TEDxNewy. Questions to{" "}
              <a
                href={`mailto:${ORG.email}`}
                className="text-[#e02214] underline-offset-4 hover:underline"
              >
                {ORG.email}
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
