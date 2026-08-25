// Content lifted from the live site (lib/nav-fallback.ts, app/page.tsx, llms.txt)
// so the recreation reads in the real TEDxNewy voice.
window.TEDX = {
  nav: [
    { key: "upcoming", label: "Upcoming", style: "list", kicker: "On the horizon", heading: "What's coming up",
      blurb: "The events we're building toward across the season.",
      items: [
        { label: "Signal", href: "#signal", description: "24 October · Conservatorium of Music" },
        { label: "Student Speaker Competition", href: "#", description: "Submissions close 6 September" },
      ] },
    { key: "past", label: "Past Events", style: "cards", items: [
      { label: "Signature", href: "#events", description: "Our flagship main stage, year on year", imageUrl: "../../../../../public/images/nav-signature.webp", gradient: "var(--grad-brand)", ctaLabel: "Explore Signature" },
      { label: "Salons", href: "#events", description: "Our intimate idea nights", imageUrl: "../../../../../public/images/salon-2050/community-event.webp", gradient: "var(--grad-special)", ctaLabel: "Explore salons" },
      { label: "All Talks", href: "#events", description: "Watch every TEDxNewy talk", imageUrl: "../../../../../public/images/nav-all-talks.webp", gradient: "var(--grad-flagship)", ctaLabel: "Watch talks" },
    ] },
    { key: "participate", label: "Participate", style: "cards", items: [
      { label: "Volunteer with us", href: "#participate", description: "Be part of the season", imageUrl: "../../../../../public/images/stage-dialogue.jpg", gradient: "var(--grad-special)", ctaLabel: "Learn more" },
      { label: "Partner with us", href: "#participate", description: "Back the season", imageUrl: "../../../../../public/images/participate/partners.webp", gradient: "var(--grad-brand)", ctaLabel: "Start a conversation" },
      { label: "Nominate a speaker", href: "#participate", description: "Tell us who we're missing", imageUrl: "../../../../../public/images/stage-benjie.jpg", gradient: "var(--grad-flagship)", ctaLabel: "Learn more" },
    ] },
    { key: "about", label: "About", style: "list", kicker: "About TEDxNewy", heading: "Who we are",
      blurb: "What we stand for and the people behind the season.",
      items: [
        { label: "Mission", href: "#", description: "What TEDxNewy stands for" },
        { label: "Sponsors", href: "#", description: "The partners behind the season" },
        { label: "Team", href: "#", description: "The volunteer crew" },
      ] },
  ],
  pastEvents: [
    { title: "Youth Futures Lab", date: "7 August 2026", venue: "The Base, Newcastle", image: "../../../../../public/images/youth-futures/yfl-card.webp", kind: "special" },
    { title: "Newcastle 2050", date: "30 April 2026", venue: "Q Building, Honeysuckle", image: "../../../../../public/images/salon-2050/community-event.webp", kind: "salon" },
    { title: "60-Second Talk Night", date: "27 February 2026", venue: "The Base, Newcastle", image: "../../../../../public/images/talk-night.webp", kind: "special" },
    { title: "Reframe", date: "18 October 2025", venue: "Newcastle City Hall", image: "../../../../../public/images/past-2025.jpg", kind: "flagship" },
    { title: "Beyond Boundaries", date: "19 October 2024", venue: "Newcastle City Hall", image: "../../../../../public/images/past-2024.jpg", kind: "flagship" },
  ],
  speakers: [
    { name: "Harry Garside", title: "Olympic boxer and author", image: "../../../../../public/images/speakers/harry-garside.webp" },
    { name: "Mariam Mohammed", title: "Financial literacy educator", image: "../../../../../public/images/speakers/mariam-mohammed.webp" },
    { name: "Declan Edwards", title: "Wellbeing scientist", image: "../../../../../public/images/speakers/declan-edwards.webp" },
    { name: "Kate Cashman", title: "Leadership coach", image: "../../../../../public/images/speakers/kate-cashman.webp" },
    { name: "Dan Ballard", title: "Energy transition strategist", image: "../../../../../public/images/speakers/dan-ballard.webp" },
    { name: "Charanya Ramakrishnan", title: "Researcher, University of Newcastle", image: "../../../../../public/images/speakers/charanya-ramakrishnan.webp" },
    { name: "Tim Stewart", title: "Behavioural designer", image: "../../../../../public/images/speakers/tim-stewart.webp" },
    { name: "Trudi Boatwright", title: "Artist and educator", image: "../../../../../public/images/speakers/trudi-boatwright.webp" },
  ],
  team: [
    { name: "Theo Kapodistrias", title: "Licensee and host", image: "../../../../../public/images/team/theo-kapodistrias.webp" },
    { name: "Hannah Berry", title: "Speaker curation", image: "../../../../../public/images/team/hannah-berry.webp" },
    { name: "Craig Smith", title: "Partnerships", image: "../../../../../public/images/team/craig-smith.webp" },
    { name: "Melanie Renfrew", title: "Production", image: "../../../../../public/images/team/melanie-renfrew.webp" },
  ],
  faqs: [
    { q: "Where is Signal held?", a: "The Conservatorium of Music, in the middle of town. A ten minute walk from Newcastle Interchange." },
    { q: "Can I come on my own?", a: "Most people do. There is a long break built in for exactly that reason." },
    { q: "What is included in a ticket?", a: "Every talk, the breaks, and catering through the day." },
    { q: "Do you offer concession tickets?", a: "Yes. Get in touch and we will sort something out. Nobody should miss out on cost." },
  ],
  footerColumns: [
    { title: "Explore", items: [{ label: "Events", href: "#events" }, { label: "Signature", href: "#events" }, { label: "Salons", href: "#events" }, { label: "Talks", href: "#events" }] },
    { title: "Participate", items: [{ label: "Speakers", href: "#participate" }, { label: "Partners", href: "#participate" }, { label: "Volunteers", href: "#participate" }] },
    { title: "About", items: [{ label: "Mission", href: "#" }, { label: "The Team", href: "#" }, { label: "Sponsors", href: "#" }, { label: "Press", href: "#" }, { label: "Contact", href: "#" }] },
  ],
  socials: [
    { label: "TEDxNewy on Instagram", href: "#", icon: "../../../../../public/brand/social/instagram.png" },
    { label: "TEDxNewy on TikTok", href: "#", icon: "../../../../../public/brand/social/tiktok.png" },
    { label: "TEDxNewy on LinkedIn", href: "#", icon: "../../../../../public/brand/social/linkedin.png" },
  ],
  acknowledgment: "TEDxNewy is staged on the land of the Awabakal and Worimi people. We pay our respects to Elders past, present and emerging, and acknowledge their continuing connection to land, waters and culture. Sovereignty was never ceded.",
  access: "TEDxNewy is for everyone, regardless of ability, age, background, culture, gender or identity. If something would help you take part, whether an access requirement, a dietary need or anything else, please get in touch.",
};
