import PageHero from "@/components/PageHero";
import { ORG } from "@/lib/data";

export const metadata = {
  title: "Privacy Policy · TEDxNewy",
  description:
    "How TEDxNewy collects, stores and uses the information you share with us through forms and email.",
};

const LAST_UPDATED = "18 October 2026";

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        titleTop="Privacy Policy"
        intro={
          <>
            We&rsquo;re a volunteer-run, independently licensed TEDx event in
            Newcastle, Australia. We don&rsquo;t sell your data or run sponsor
            data deals. Here&rsquo;s exactly what we collect and why.
            <span className="mt-4 block text-[14px] text-[#6b6459]">
              Last updated: {LAST_UPDATED}
            </span>
          </>
        }
      />

      <section className="mx-auto max-w-[680px] px-5 pb-24 md:px-6 md:pb-32">
        <div className="space-y-10 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#000000]">
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
            <h2 className="font-sans text-[20px] font-medium text-[#000000]">
              Where it&rsquo;s stored
            </h2>
            <p className="mt-3">
              Submissions are stored in our database and (where applicable)
              relayed to{" "}
              <a href={`mailto:${ORG.email}`} className="text-[#b91404] underline-offset-4 hover:underline">
                {ORG.email}
              </a>{" "}
              as a notification. The database is hosted on Supabase in the AWS
              Sydney region (ap-southeast-2). We don&rsquo;t share your data
              with third parties beyond the providers required to run the site
              and our events (Vercel for hosting, Supabase for the database,
              and our email and ticketing providers), and the advertising
              measurement described under Cookies and analytics below.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#000000]">
              How long we keep it
            </h2>
            <p className="mt-3">
              We keep your submission until you ask us to delete it, or until
              the project it relates to is over and we no longer need it.
              You can request deletion at any time by emailing{" "}
              <a
                href={`mailto:${ORG.email}`}
                className="text-[#b91404] underline-offset-4 hover:underline"
              >
                {ORG.email}
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#000000]">
              What you have a right to
            </h2>
            <p className="mt-3">
              Under the Australian Privacy Act and the GDPR (if you&rsquo;re in
              the EU/UK), you can ask us to: access the data we hold about
              you, correct it, delete it, or stop using it for the original
              purpose. Email{" "}
              <a href={`mailto:${ORG.email}`} className="text-[#b91404] underline-offset-4 hover:underline">
                {ORG.email}
              </a>{" "}
              and we&rsquo;ll action it within 30 days.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#000000]">
              Cookies and analytics
            </h2>
            <p className="mt-3">
              We use the Meta Pixel on this site to measure how our ads on
              Facebook and Instagram perform and to reach people who might
              enjoy our events. When you visit, the pixel sets cookies in your
              browser and sends Meta information about your visit, such as the
              pages you view, and when you click through to get tickets or
              subscribe. Meta handles that information under its own privacy
              policy. You can turn off ad personalisation in your Facebook and
              Instagram ad settings, or block the pixel with your browser
              settings or a tracking blocker.
            </p>
            <p className="mt-3">
              We also use Vercel Web Analytics to count visits and see which
              pages are popular. It is anonymous and doesn&rsquo;t use cookies
              to follow you around the web. The site sets only the cookies it
              needs to work, such as a session cookie if you visit a
              form-protected page. We don&rsquo;t use Google Analytics. If we
              add anything else, we will update this page first.
            </p>
          </div>

          <div>
            <h2 className="font-sans text-[20px] font-medium text-[#000000]">
              Who runs this
            </h2>
            <p className="mt-3">
              TEDxNewy is operated by <strong>{ORG.legalName}</strong> (ACN{" "}
              {ORG.acn}). {ORG.licence} Privacy questions go to{" "}
              <a
                href={`mailto:${ORG.email}`}
                className="text-[#b91404] underline-offset-4 hover:underline"
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
