import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Compass,
  Leaf,
  MoveRight,
  Mountain,
  Quote,
  ShieldCheck,
} from "lucide-react";

const heritageTrails = [
  {
    category: "High Altitude",
    title: "The Forbidden Kingdom of Upper Mustang",
    description:
      "A stark landscape of wind-sculpted cliffs and 15th-century monasteries where Tibetan culture remains untouched.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0-QiamiNBdCvHzTXi-WHg6SVViShoZUB3854DsDTPpQM9dEvPcP7APjo0-LBnKjE6ZyfXyr8AyEDgR-eVBYp4kDx1y22E7c-HNst1aX_gXeBmLS24YIPYqh9RCfDHPrcodfuiJYDdn-kBui-DM0XyM5agBd4TEabsT-qfzNDzevQPYRj48cvyCrRHETrRXAK1N-LO5gziFIFfvdVpzwPY_soQqxGww8gOdgEr2CSoKwNC0FIeSUXQtK1MRTlA_9cGNSLK3_K-",
    alt: "Ancient Mustang cliff dwelling carved into orange sandstone under a brilliant blue sky.",
  },
  {
    category: "Lush Valleys",
    title: "Eastern Nepal Tea Trails",
    description:
      "Walk through mist-covered tea gardens and rhododendron forests in the shadows of Kanchenjunga.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC_d6YsnFyIkfIXlSfsLwEnjvWtkTWXBYHTB6XJewGpdssdsZ-yKUCFX1RXRWqnCzk6NIRvcQIQv5A7A24rHS9_DXVP9JkpSV6WTdE9T_iniVNehYWf17o-h5vmYft8l8nkwGSfNZFs5XXrxRQfU9_lN0tMQekEWExtgBunplOXfMkOE-_AALMMrO5moe3aA8S4_XaCwPCVgo7iyl1WPwy9vQgxBVA3UueALN2BU3ewXGgEubsFzr5eDvAGQ7H4Eg-tvJiLVIjY",
    alt: "Terraced tea gardens in Eastern Nepal shrouded in soft mountain mist.",
  },
  {
    category: "Artisan Soul",
    title: "Kathmandu Valley Crafts",
    description:
      "Reconnect with living heritage through the workshops of master woodcarvers and thangka painters.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCSjQNkoNOzgQbZROqoup82360Gpi1ekyG_Jc3xY28k5y_NeXQevjvi5Nhc9j_a5hLe8H6Uy17Z7glZ0_8mwSq8IBvpPFaB67ruMH3q4nZdDEnELrXRMRXI5lQ7L0cygUIbiumg280dr6vwEftBiG4rxjh5F382Ib34g3jpt1dNVMDRPicCgtaSCf7exTA8eKrwgQLIBNZHtExcH04OUhqfZY5LTlYZvbeBVWH44PhVqF-HNCDvcSUXeTeY7DFKzTq-QGwvBr61",
    alt: "Intricate wooden window frame from a traditional Newari house in Bhaktapur.",
  },
  {
    category: "Wild Frontier",
    title: "Western Nepal Lakes",
    description:
      "The crystalline blue waters of Phoksundo Lake offer a solitude rarely found in modern travel.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCtpEBffMNLzis1wnoIxRm2117t2470Uinps4M7kbZFMDgc3wjLQk7ayFq0_G0xl3moXWyArhGx2kgcebuMlas1qPJNRlcnqD18Z50Tlc2WqG0wZnwixENxfYfCiqHzSa9Uz5JDl-4rnSONN7kzJ8OOpXHUPCHYvlhqzM74HGb3uAG2tgrQvPQyCx8PrPVPgyq3OZLBIfXkZ1PO4ATYHfZFRAnjHtXoDhWZfUfiauN3xrY9Edcy6lQUSOSfXH-L4shGiCoTWoHV",
    alt: "Deep turquoise surface of Phoksundo Lake surrounded by rugged ochre mountains.",
  },
] as const;

const responsibleTravelItems = [
  {
    Icon: ShieldCheck,
    title: "Verified Community Partners",
    description:
      "Every lodge and guide passes our rigorous social and environmental audit.",
  },
  {
    Icon: Leaf,
    title: "Zero-Waste Expeditions",
    description:
      "We implement strict waste-management and plastic-free protocols on every trail.",
  },
];

const journeySteps = [
  {
    Icon: Compass,
    title: "1. Discover",
    description:
      "Browse our curated collection of heritage-focused trails and hidden destinations.",
  },
  {
    Icon: Brain,
    title: "2. Plan ",
    description:
      "Our Trail Builder Pipeline optimizes your route based on budget,timeline, and cultural interests.",
  },
  {
    Icon: Mountain,
    title: "3. Experience",
    description:
      "Step onto the trail with local experts and all logistics handled with professional precision.",
  },
];

const testimonials = [
  {
    quote:
      "Through Nepal Uncharted, we've been able to bring trekkers to our village who truly care about our history. The income has allowed us to restore the community shrine.",
    name: "Pasang Sherpa",
    role: "Lead Cultural Guide, Solukhumbu",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA-gbVAX_NOU1Gmo_ANwKkixwxGXAq1yWI3iFb5QcKQxK6z8aB2xMtAIBfujjPBshQyKj0_JbLAFFW3uNDBWrccaf7gDushVFQuyxBo5Ev5He_xZ1delYYRTZAfQGAKP0j0ILOtQBSYuW59pGoRcK1tLklEO4y5HKgEUGsSnbTSSYCpVufjgjk5r2ZVyzhfb88pwug1TsICIj4kabzOTmRdlWfL6NjiIryGVsxX3Z-68R75dUrenU5rrYi73bZaHT22DEbDR5xm",
    alt: "Elderly mountain guide in Nepal wearing a traditional Dhaka topi.",
  },
  {
    quote:
      "Our marketplace connection has given our pottery cooperative a global voice. We are no longer just making souvenirs; we are sharing our ancestral story.",
    name: "Anjali Prajapati",
    role: "Master Potter, Bhaktapur",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDkvkg-nwIAguleSerorCRxXlgXzFvLpivC9ZeeaugxiZmo5vOgY4JpHmXJreiRZggFIfr8B1_84eScNJiUMGKagSQ3BK1sq0COV4r13mqZQA2WOrSoUTxJsHm91mZd_By8UfrCUquDThP3iHjtCQutdTWfTLpIXDlXM8yvgNKCE_WRClnLuf-Rdm-t6SrBj7qmkzu4SAvhHDadep3K_zrMb2lPY6qam9o95SoyQwtFLcgwLTDwnpHosTmIiedKaYC0MlGM2NYy",
    alt: "Young woman artisan in Kathmandu working on pottery in a bright studio.",
  },
];

export default function Homepage() {
  const [mustangTrail, teaTrail, craftsTrail, lakesTrail] = heritageTrails;

  return (
    <div className="bg-surface text-on-surface">
      <section className="relative flex h-[921px] items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            className="h-full w-full object-cover brightness-90 grayscale-[0.2]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3lpjK7hMBTpsw-hBQ9mtnqm5OV9PBE4LyBtmsynus0rBPnGjoOgrPsgMZyajc629AOjmE-u58iZUpxrxXWh8S1ZH6Z1FrVqxx0we1UGsVruok9s9uhm0ahXvXrRZx9wE17qsMoXylzpsTwFAvLfmy7B_2SlQWjCYwPQSVe0N04gvZDQcZQv_XYBg9d0TS3bzbw_OrchUuK3I7CLXAahzWBPkDJRJrniyf2-qhm7Q0b02eERKSDzcAxhXgFW2LDiQLMtjJLK8T"
            alt="Cinematic wide-angle shot of the Himalayas at dawn with ancient monasteries in the foreground."
          />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-8">
          <div className="max-w-2xl border-l-4 border-primary-container bg-white/10 p-xl backdrop-blur-sm">
            <h1 className="mb-lg font-h1 text-h1 text-white">
              Discover the Uncharted Heart of Nepal
            </h1>
            <p className="mb-xl font-body-lg text-body-lg leading-relaxed text-white">
              Beyond the maps and crowded peaks lies a Nepal of hidden valleys, ancient
              traditions, and sustainable exploration. We guide you to the soul of the
              Himalayas.
            </p>
            <Link
              href="/trail-builder"
              className="inline-flex items-center gap-2 bg-primary-container px-xl py-md font-serif text-sm uppercase tracking-widest text-on-primary-container transition-all hover:brightness-110"
            >
              Start Your Journey
              <ArrowRight aria-hidden="true" size={20} strokeWidth={1.9} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-8 py-24">
        <div className="mb-16 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <span className="mb-4 inline-block bg-tertiary-fixed px-3 py-1 font-label-sm text-label-sm text-on-tertiary-fixed">
              AUTHENTIC EXPERIENCES
            </span>
            <h2 className="font-h2 text-h2 text-on-surface">Featured Heritage Trails</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
          <article className="group flex h-full flex-col overflow-hidden border border-stone-200 bg-white md:col-span-8 md:flex-row">
            <div className="overflow-hidden md:w-3/5">
              <img
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={mustangTrail.image}
                alt={mustangTrail.alt}
              />
            </div>
            <div className="flex flex-col justify-between p-lg md:w-2/5">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-tighter text-secondary">
                  {mustangTrail.category}
                </span>
                <h3 className="mb-4 mt-2 font-h3 text-h3">{mustangTrail.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {mustangTrail.description}
                </p>
              </div>
              <Link
                className="mt-8 flex items-center gap-2 font-bold text-primary transition-all hover:gap-4"
                href="/marketplace"
              >
                Explore Trail <MoveRight aria-hidden="true" size={22} strokeWidth={1.9} />
              </Link>
            </div>
          </article>

          {[teaTrail, craftsTrail].map((trail) => (
            <article
              key={trail.title}
              className="group overflow-hidden border border-stone-200 bg-white md:col-span-4"
            >
              <div className="h-64 overflow-hidden">
                <img
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={trail.image}
                  alt={trail.alt}
                />
              </div>
              <div className="p-lg">
                <span className="font-label-sm text-label-sm uppercase tracking-tighter text-secondary">
                  {trail.category}
                </span>
                <h3 className="mb-2 mt-2 font-h3 text-h3">{trail.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {trail.description}
                </p>
              </div>
            </article>
          ))}

          <article className="group flex h-full flex-col overflow-hidden border border-stone-200 bg-white md:col-span-8 md:flex-row">
            <div className="flex flex-col justify-center p-lg md:w-2/5">
              <span className="font-label-sm text-label-sm uppercase tracking-tighter text-secondary">
                {lakesTrail.category}
              </span>
              <h3 className="mb-4 mt-2 font-h3 text-h3">{lakesTrail.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {lakesTrail.description}
              </p>
              <Link
                className="mt-8 flex items-center gap-2 font-bold text-primary transition-all hover:gap-4"
                href="/marketplace"
              >
                Discover Remote Trails
                <MoveRight aria-hidden="true" size={22} strokeWidth={1.9} />
              </Link>
            </div>
            <div className="overflow-hidden md:w-3/5">
              <img
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={lakesTrail.image}
                alt={lakesTrail.alt}
              />
            </div>
          </article>
        </div>
      </section>

      <section className="bg-surface-container-low py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 px-8 md:grid-cols-2">
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -left-4 -top-4 h-32 w-32 border-l-2 border-t-2 border-secondary opacity-20 md:-left-8 md:-top-8" />
            <img
              className="relative z-10 w-full border-8 border-white object-cover shadow-sm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPzHxTagavkLmZhmPUhxO3i2eDosrREOMe-dcyoPHxcjxxY_RlfqpkUut2dckZ9K3VspJHgLnhuhNgZbJmM0E-y3U8jgiYmsjYLH9642TqoQvOMAM7pfaA43-8OOwZ1snw00H-muaEjfDjPY-KsOP5pzblAhTJLCpUYlwiEckHZ8pf7UiT3cRK68K1ShZ-D6hCBWcF67r7mGQKgWVT_doI-UhRxsV8ugccG3ofjoje1_OZDxT60jSzipoNBfkw1gY4k-8_BEXw"
              alt="Smiling Nepalese woman from a local mountain community in traditional clothing."
            />
          </div>
          <div>
            <h2 className="mb-lg font-h2 text-h2 text-on-surface">
              Why Responsible Travel Matters
            </h2>
            <p className="mb-xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
              In the &quot;uncharted&quot; regions, tourism is more than a business; it is a
              lifeline. By choosing Nepal Uncharted, you aren&apos;t just visiting a
              destination; you are participating in a Sustainability Protocol that
              restores heritage sites and funds local education.
            </p>
            <ul className="space-y-6">
              {responsibleTravelItems.map((item) => {
                const Icon = item.Icon;

                return (
                  <li key={item.title} className="flex items-start gap-4">
                    <Icon
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-secondary"
                      size={24}
                      strokeWidth={1.9}
                    />
                    <div>
                      <h4 className="font-bold text-on-surface">{item.title}</h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {item.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-12">
              <Link
                href="/marketplace"
                className="inline-flex cursor-pointer items-center gap-2 border-2 border-secondary px-4 py-2 font-serif text-sm uppercase tracking-widest text-secondary transition-all hover:bg-secondary hover:text-white"
              >
                Our Recent Listings
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-8 py-24 text-center">
        <h2 className="mb-4 font-h2 text-h2 text-on-surface">Your Journey Decoded</h2>
        <p className="mx-auto mb-16 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Seamlessly bridging the gap between your aspiration and the actual experience.
        </p>
        <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="absolute left-1/4 right-1/4 top-12 z-0 hidden h-px bg-stone-200 md:block" />
          {journeySteps.map((step) => {
            const Icon = step.Icon;

            return (
              <div key={step.title} className="relative z-10 flex flex-col items-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center border border-stone-200 bg-white">
                  <Icon aria-hidden="true" className="text-primary" size={40} strokeWidth={1.7} />
                </div>
                <h3 className="mb-2 font-h3 text-h3">{step.title}</h3>
                <p className="px-4 font-body-md text-body-md text-on-surface-variant">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-8">
          <h2 className="mb-16 text-center font-h2 text-h2">
            Voices from the Community
          </h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.name}
                className="flex flex-col gap-8 border border-stone-100 bg-stone-50 p-8 md:flex-row"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden">
                  <img
                    className="h-full w-full object-cover"
                    src={testimonial.image}
                    alt={testimonial.alt}
                  />
                </div>
                <div>
                  <Quote aria-hidden="true" className="mb-4 text-tertiary" size={28} />
                  <p className="mb-6 font-body-lg text-body-lg italic text-on-surface">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                    {testimonial.role}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
