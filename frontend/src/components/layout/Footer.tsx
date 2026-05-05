import Link from "next/link";
import { ArrowRight, Globe2, Mail, Navigation } from "lucide-react";

const navigationLinks = [
  { href: "/marketplace", label: "Heritage Trails" },
  { href: "/impact", label: "Sustainability Protocol" },
  { href: "/provider", label: "Community Partners" },
  { href: "#", label: "Terms of Service" },
];

const connectLinks = [
  { href: "#", label: "Website language", Icon: Globe2 },
  { href: "mailto:hello@nepaluncharted.com", label: "Email", Icon: Mail },
  { href: "/marketplace", label: "Explore nearby", Icon: Navigation },
];

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50 px-8 py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link
            href="/"
            className="mb-4 block font-serif text-xl text-orange-800"
          >
            Nepal Uncharted
          </Link>
          <p className="font-serif text-sm leading-relaxed text-stone-600">
            © 2024 Nepal Uncharted. Preserving Heritage Through Sustainable
            Exploration.
          </p>
        </div>

        <div>
          <h4 className="mb-6 font-serif text-sm font-bold uppercase tracking-widest text-green-900">
            Navigation
          </h4>
          <ul className="space-y-4">
            {navigationLinks.map((link) => (
              <li key={link.label}>
                <Link
                  className="font-serif text-sm text-stone-600 underline transition-all hover:text-green-800"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-6 font-serif text-sm font-bold uppercase tracking-widest text-green-900">
            Connect
          </h4>
          <div className="flex gap-4">
            {connectLinks.map((link) => {
              const Icon = link.Icon;

              return (
              <Link
                key={link.label}
                href={link.href}
                aria-label={link.label}
                className="cursor-pointer text-stone-500 transition-colors hover:text-primary"
              >
                <Icon aria-hidden="true" size={24} strokeWidth={1.8} />
              </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="mb-6 font-serif text-sm font-bold uppercase tracking-widest text-green-900">
            Newsletter
          </h4>
          <div className="flex border-b border-stone-300 py-2">
            <input
              className="w-full border-none bg-transparent font-serif text-sm focus:ring-0"
              placeholder="Your email"
              type="email"
              aria-label="Newsletter email"
            />
            <button
              className="text-primary"
              type="button"
              aria-label="Subscribe to newsletter"
            >
              <ArrowRight aria-hidden="true" size={24} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
