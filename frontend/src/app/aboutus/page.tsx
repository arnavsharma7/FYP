import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Bot,
  Building2,
  Compass,
  HandCoins,
  Landmark,
  MapPinned,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

const heroImage =
  "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1800&q=85";

const focusAreas = [
  {
    Icon: MapPinned,
    title: "Dispersed Tourism",
    description:
      "Move discovery beyond the same crowded routes by giving smaller regions, heritage towns, and rural hosts a visible digital presence.",
  },
  {
    Icon: ShieldCheck,
    title: "Verified Experiences",
    description:
      "Help travelers book homestays, workshops, guides, and cultural activities with clearer trust signals and provider accountability.",
  },
  {
    Icon: Sparkles,
    title: "Personalized Planning",
    description:
      "Use trail recommendations and itinerary building to match traveler interests, duration, and budget with real provider experiences.",
  },
  {
    Icon: HandCoins,
    title: "Local Economic Value",
    description:
      "Design booking flows around community benefit, transparent spending, and long-term participation from local partners.",
  },
] as const;

const currentPlatform = [
  "Verified experience marketplace for bookable local activities.",
  "Trail Builder for interest, budget, and duration based recommendations.",
  "Provider dashboards for listings, reviews, booking visibility, and status workflows.",
  "Tourist dashboard for bookings, saved trails, projected impact, and achievement medals.",
  "Dynamic impact ledger calculated from active booking amounts, tax, local earnings, community fund, platform fee, and operations.",
  "Completion-based achievement medals issued after a provider marks a confirmed trip as completed.",
  "Immersive media support through panorama and location previews where providers add them.",
] as const;

const futureEnhancements = [
  {
    Icon: Building2,
    title: "B2B Agency Portal",
    description:
      "Agency accounts, package curation, white-label itineraries, commission tracking, and managed group bookings.",
  },
  {
    Icon: Bot,
    title: "Advanced AI Recommendation Engine",
    description:
      "A stronger personalization layer that learns from traveler preferences, season, budget, accessibility, and completed trips.",
  },
  {
    Icon: Landmark,
    title: "Curated Heritage Story Feeds",
    description:
      "Articles, short videos, interviews, and cultural context from local storytellers, historians, and community partners.",
  },
] as const;

const impactModel = [
  {
    title: "Booking-Level Split",
    description:
      "Each booking stores the base amount, tax, local earnings, community fund, platform fee, and operations amount.",
  },
  {
    title: "Tourist Impact Ledger",
    description:
      "Pending, confirmed, and completed bookings appear in the tourist dashboard so travelers can understand expected impact immediately after booking.",
  },
  {
    title: "Completion Medals",
    description:
      "When a provider marks a confirmed booking as completed, the system issues a verifiable achievement medal linked to the tourist, booking, and experience.",
  },
] as const;

export default function AboutUsPage() {
  return (
    <main className="bg-surface text-on-surface">
      <section className="relative min-h-[760px] overflow-hidden">
        <img
          src={heroImage}
          alt="Traditional village architecture and mountain landscape in Nepal."
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#121c2c]/90 via-[#121c2c]/58 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl border-l-4 border-primary-container bg-white/10 p-6 backdrop-blur-sm md:p-10">
            <p className="font-label-sm text-label-sm uppercase text-inverse-primary">
              About Nepal Uncharted
            </p>
            <h1 className="mt-4 font-h1 text-4xl text-white md:text-h1">
              A digital bridge to Nepal&apos;s overlooked heritage journeys.
            </h1>
            <p className="mt-5 max-w-2xl text-body-lg leading-8 text-white/88">
              Nepal Uncharted connects conscious travelers with verified local guides,
              community homestays, artisan workshops, and cultural experiences that are
              too often invisible in mainstream tourism.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 bg-primary-container px-6 py-3 font-serif text-sm uppercase tracking-widest text-on-primary-container transition hover:brightness-110"
              >
                Explore Experiences
                <ArrowRight size={18} strokeWidth={1.8} />
              </Link>
              <Link
                href="/trail-builder"
                className="inline-flex items-center justify-center gap-2 border border-white/50 px-6 py-3 font-serif text-sm uppercase tracking-widest text-white transition hover:bg-white hover:text-on-surface"
              >
                Build a Trail
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <p className="font-label-sm text-label-sm uppercase text-primary">The Problem</p>
          <h2 className="mt-3 font-h2 text-3xl text-on-surface md:text-h2">
            Tourism is visible in a few places, but heritage lives everywhere.
          </h2>
        </div>
        <div className="space-y-5 text-body-md leading-7 text-on-surface-variant">
          <p>
            Nepal&apos;s tourism economy is still concentrated around a small number of
            trekking routes and major cities. That creates overtourism in popular areas
            while rural homestays, artisan communities, cultural sites, and local hosts
            remain hard to discover and harder to book.
          </p>
          <p>
            Travelers who want authentic experiences face scattered information, limited
            verification, and weak booking confidence. Local providers face the opposite
            problem: they may have meaningful experiences to offer, but no trusted digital
            channel to reach domestic or international travelers.
          </p>
        </div>
      </section>

      <section className="bg-surface-container-low py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-label-sm text-label-sm uppercase text-primary">Our Direction</p>
            <h2 className="mt-3 font-h2 text-3xl text-on-surface md:text-h2">
              Built for responsible discovery, not generic travel booking.
            </h2>
            <p className="mt-4 text-body-md leading-7 text-on-surface-variant">
              The platform focuses on discovery, verification, planning, booking, and
              post-booking visibility for community-based tourism experiences.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {focusAreas.map((item) => {
              const Icon = item.Icon;

              return (
                <article
                  key={item.title}
                  className="border border-outline-variant bg-white p-5 transition hover:-translate-y-1 hover:border-primary"
                >
                  <Icon className="text-primary" size={28} strokeWidth={1.8} />
                  <h3 className="mt-5 font-h3 text-xl text-on-surface">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="border border-outline-variant bg-white p-6 md:p-8">
          <div className="flex items-center gap-3">
            <BadgeCheck className="text-secondary" size={26} strokeWidth={1.8} />
            <h2 className="font-h2 text-3xl text-on-surface">What We Are Building</h2>
          </div>
          <ul className="mt-7 space-y-4">
            {currentPlatform.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-on-surface-variant">
                <span className="mt-2 h-2 w-2 shrink-0 bg-secondary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-outline-variant bg-inverse-surface p-6 text-inverse-on-surface md:p-8">
          <div className="flex items-center gap-3">
            <Compass className="text-inverse-primary" size={26} strokeWidth={1.8} />
            <h2 className="font-h2 text-3xl">Future Enhancements</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-inverse-on-surface/76">
            These ideas remain valuable, but they are intentionally kept out of the current
            implementation scope so the booking, impact, and provider workflows stay focused.
          </p>
          <div className="mt-7 space-y-4">
            {futureEnhancements.map((item) => {
              const Icon = item.Icon;

              return (
                <article key={item.title} className="border border-white/12 bg-white/6 p-4">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 shrink-0 text-inverse-primary" size={20} strokeWidth={1.8} />
                    <div>
                      <h3 className="font-h3 text-lg">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-inverse-on-surface/76">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="font-label-sm text-label-sm uppercase text-primary">
              Impact Without Hype
            </p>
            <h2 className="mt-3 font-h2 text-3xl text-on-surface md:text-h2">
              Community impact should be calculated from real booking data.
            </h2>
            <p className="mt-5 text-body-md leading-7 text-on-surface-variant">
              The current system calculates impact from booking records instead of static
              claims. Travelers see projected impact after booking, and achievement medals
              are issued only after the provider completes the experience.
            </p>
          </div>

          <div className="space-y-4">
            {impactModel.map((item, index) => (
              <article key={item.title} className="border border-outline-variant bg-surface p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-tertiary-fixed font-serif text-sm text-on-tertiary-fixed">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-h3 text-xl text-on-surface">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      {item.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <article className="border border-outline-variant bg-surface-container-low p-6">
            <Landmark className="text-primary" size={28} strokeWidth={1.8} />
            <h3 className="mt-5 font-h3 text-xl">Heritage Visibility</h3>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              Promote living traditions, local skills, and place-based knowledge through
              bookable experiences instead of passive listings.
            </p>
          </article>
          <article className="border border-outline-variant bg-surface-container-low p-6">
            <UsersRound className="text-secondary" size={28} strokeWidth={1.8} />
            <h3 className="mt-5 font-h3 text-xl">Provider Opportunity</h3>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              Give hosts and guides tools to publish, manage, and receive bookings from a
              trusted platform.
            </p>
          </article>
          <article className="border border-outline-variant bg-surface-container-low p-6">
            <Award className="text-tertiary" size={28} strokeWidth={1.8} />
            <h3 className="mt-5 font-h3 text-xl">Achievement Medals</h3>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              Reward completed trips with medals that connect the traveler&apos;s experience
              to the booking record and community impact summary.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-inverse-surface px-4 py-20 text-inverse-on-surface sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="font-label-sm text-label-sm uppercase text-inverse-primary">
              Start With What Exists
            </p>
            <h2 className="mt-3 font-h2 text-3xl md:text-h2">
              Discover, plan, and book responsible experiences across Nepal.
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex w-fit items-center gap-2 bg-primary-container px-6 py-3 font-serif text-sm uppercase tracking-widest text-on-primary-container transition hover:brightness-110"
          >
            Browse Marketplace
            <ArrowRight size={18} strokeWidth={1.8} />
          </Link>
        </div>
      </section>
    </main>
  );
}
