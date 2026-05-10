import PageHero from "@/components/PageHero";
import { ORG } from "@/lib/data";

export const metadata = {
  title: "Privacy · TEDxNewy",
  description:
    "How TEDxNewy collects, stores and uses the information you share with us through forms and email.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        kicker="Privacy"
        titleTop="Plain-English privacy."
        intro={
          <>
            We&rsquo;re a volunteer-run, independently licensed TEDx event in
            Newcastle, Australia. We don&rsquo;t do tracking pixels,
            re-targeting, or sponsor data deals. Here&rsquo;s exactly what we
            collect and why.
          </>
        }
      />

      <section className="mx-auto max-w-[680px] px-5 pb-24 md:px-6 md:pb-32">
        <div className="space-y-10 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              What we collect
            </h2>
            <p className="mt-3">
              When you submit one of our forms we collect only the fields you
              fill in:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                <strong>Subscribe</strong>: email address.
              </li>
              <li>
                <strong>Apply (volunteer)</strong>: name, email, phone
                (optional), crew preference, and your short note.
              </li>
              <li>
                <strong>Nominate (a speaker)</strong>: your name and email,
                your relationship to the nominee, the nominee&rsquo;s name, what
                they do, the idea, and an optional link to their work.
              </li>
              <li>
                <strong>Tickets / waitlist</strong>: name, email, plus the
                fields specific to the form you submit.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              Where it&rsquo;s stored
            </h2>
            <p className="mt-3">
              Submissions are stored in our database and (where applicable)
              relayed to <code>{ORG.email}</code> as a notification. The
              database is hosted on Supabase in the AWS Sydney region
              (ap-southeast-2). We don&rsquo;t share your data with third
              parties beyond the providers required to run the site (Vercel
              for hosting, Supabase for the database).
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              How long we keep it
            </h2>
            <p className="mt-3">
              We keep your submission until you ask us to delete it, or until
              the project it relates to is over and we no longer need it.
              You can request deletion at any time by emailing{" "}
              <a
                href={`mailto:${ORG.email}`}
                className="text-[#e02214] underline-offset-4 hover:underline"
              >
                {ORG.email}
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              What you have a right to
            </h2>
            <p className="mt-3">
              Under the Australian Privacy Act and the GDPR (if you&rsquo;re in
              the EU/UK), you can ask us to: access the data we hold about
              you, correct it, delete it, or stop using it for the original
              purpose. Email <code>{ORG.email}</code> and we&rsquo;ll action it
              within 30 days.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              Cookies and analytics
            </h2>
            <p className="mt-3">
              We don&rsquo;t set tracking cookies. We don&rsquo;t use Google
              Analytics, Meta Pixel, or any similar tracker. The site uses
              functional cookies only (e.g. a session cookie if you visit a
              form-protected page). If we ever add lightweight analytics, we
              will update this page first.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#141210]">
              Who runs this
            </h2>
            <p className="mt-3">
              TEDxNewy is operated by <strong>{ORG.legalName}</strong> (ACN{" "}
              {ORG.acn}). {ORG.licence} Privacy questions go to{" "}
              <a
                href={`mailto:${ORG.email}`}
                className="text-[#e02214] underline-offset-4 hover:underline"
              >
                {ORG.email}
              </a>
              .
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
