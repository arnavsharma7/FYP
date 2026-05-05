"use client";

import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Navigation,
  Plus,
  Search,
  ShieldCheck,
  Store,
  Ticket,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useUserStore, type AuthUser } from "@/zustand/userStore";

type NavRole = "guest" | "tourist" | "provider" | "admin";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

const roleLinks: Record<NavRole, NavItem[]> = {
  guest: [
    { href: "/", label: "Discovery", shortLabel: "Explore", Icon: Navigation },
    { href: "/trail-builder", label: "Trail Builder", shortLabel: "Planner", Icon: Map },
    { href: "/marketplace", label: "Marketplace", shortLabel: "Market", Icon: Store },
    { href: "/aboutus", label: "About Us", shortLabel: "About", Icon: Users }
  ],
  tourist: [
    { href: "/trail-builder", label: "Trail Builder", shortLabel: "Planner", Icon: Map },
    { href: "/marketplace", label: "Marketplace", shortLabel: "Market", Icon: Store },
    { href: "/dashboard", label: "Dashboard", shortLabel: "Trips", Icon: Ticket },
    { href: "/aboutus", label: "About Us", shortLabel: "About", Icon: Users }
  ],
  provider: [
    { href: "/provider/add", label: "Add Experience", shortLabel: "Add", Icon: Plus },
    { href: "/marketplace", label: "Marketplace", shortLabel: "Market", Icon: Store },
    { href: "/provider/dashboard", label: "Dashboard", shortLabel: "Bookings", Icon: Ticket },
    { href: "/aboutus", label: "About Us", shortLabel: "About", Icon: Users }
  ],
  admin: [
    { href: "/marketplace", label: "Marketplace", shortLabel: "Market", Icon: Store },
    { href: "/admin", label: "Dashboard", shortLabel: "Users", Icon: LayoutDashboard },
    { href: "/aboutus", label: "About Us", shortLabel: "About", Icon: Users }
  ],
};

const roleAction: Record<NavRole, NavItem> = {
  guest: { href: "/trail-builder", label: "Create a trail", Icon: Plus },
  tourist: { href: "/trail-builder", label: "Create a trail", Icon: Plus },
  provider: { href: "/provider/add", label: "Add experience", Icon: Plus },
  admin: { href: "/admin", label: "Open admin", Icon: ShieldCheck },
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveRole(user: AuthUser | null, isAuthenticated: boolean): NavRole {
  if (!isAuthenticated) return "guest";
  if (user?.role === "admin") return "admin";
  if (user?.role === "provider") return "provider";
  return "tourist";
}

function NavSkeleton() {
  return (
    <div className="hidden items-center gap-8 md:flex" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-4 w-24 animate-pulse rounded bg-stone-200" />
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return <div className="hidden h-10 w-24 animate-pulse bg-stone-200 sm:block" aria-hidden="true" />;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isCheckingMe, setIsCheckingMe] = useState(true);

  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const user = useUserStore((state) => state.user);
  const fetchMe = useUserStore((state) => state.fetchMe);
  const logout = useUserStore((state) => state.logout);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      setIsCheckingMe(true);
      await fetchMe();
      if (isMounted) setIsCheckingMe(false);
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [fetchMe]);

  const authLoading = !hasHydrated || isCheckingMe;
  const role = resolveRole(user, isAuthenticated);
  const navLinks = useMemo(() => roleLinks[role], [role]);
  const bottomNavLinks = useMemo(() => navLinks.slice(0, 3), [navLinks]);
  const floatingAction = roleAction[role];
  const FloatingIcon = floatingAction.Icon;

  const closeMenus = () => {
    setIsOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenus();
    router.push("/");
  };

  return (
    <>
      <header className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-stone-200 bg-white/90 px-8 py-4 backdrop-blur-md transition-all duration-300 ease-in-out">
        <Link
          href="/"
          className="font-serif text-2xl font-bold text-orange-800 dark:text-orange-600"
          onClick={closeMenus}
        >
          Nepal Uncharted
        </Link>

        {authLoading ? (
          <NavSkeleton />
        ) : (
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const active = isActivePath(pathname, link.href);

              return (
                <Link
                  key={`${role}-${link.label}-${link.href}`}
                  href={link.href}
                  className={
                    active
                      ? "border-b-2 border-orange-700 pb-1 font-serif text-sm uppercase tracking-widest text-orange-700 dark:border-orange-500 dark:text-orange-500"
                      : "font-serif text-sm uppercase tracking-widest text-stone-600 transition-colors hover:text-orange-700 dark:text-stone-600 dark:hover:text-orange-500"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-4">
          <Link
            href="/marketplace"
            aria-label="Search experiences"
            className="text-on-surface-variant transition-colors hover:text-primary"
          >
            <Search aria-hidden="true" size={24} strokeWidth={1.8} />
          </Link>

          {authLoading ? (
            <ProfileSkeleton />
          ) : isAuthenticated ? (
            <div className="relative hidden sm:block">
              <button
                type="button"
                aria-label="Open profile menu"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center border border-outline-variant bg-surface-container-lowest text-primary transition-all hover:border-primary hover:bg-primary-container hover:text-on-primary-container"
              >
                <CircleUserRound aria-hidden="true" size={23} strokeWidth={1.8} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-64 border border-stone-200 bg-white p-3 shadow-lg">
                  <div className="border-b border-stone-200 pb-3">
                    <p className="font-serif text-sm font-semibold text-stone-800">
                      {user?.fullName || "User"}
                    </p>
                    <p className="truncate text-xs text-stone-500">{user?.email}</p>
                    <p className="mt-1 font-serif text-[10px] uppercase tracking-widest text-orange-700">
                      {role}
                    </p>
                  </div>

                  {
                    // <div className="mt-3 space-y-1">
                    //   {navLinks.map((link) => {
                    //     const Icon = link.Icon;
                    //     return (
                    //       <Link
                    //         key={`profile-${link.label}-${link.href}`}
                    //         href={link.href}
                    //         onClick={closeMenus}
                    //         className="flex items-center gap-2 px-3 py-2 font-serif text-sm uppercase tracking-widest text-stone-700 transition-colors hover:bg-stone-100 hover:text-orange-700"
                    //       >
                    //         <Icon size={15} strokeWidth={1.8} />
                    //         {link.label}
                    //       </Link>
                    //     );
                    //   })}
                    // </div>
                  }


                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 flex w-full items-center gap-2 px-3 py-2 text-left font-serif text-sm uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={16} strokeWidth={1.8} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="bg-primary-container px-6 py-2 font-serif text-sm uppercase tracking-widest text-on-primary-container transition-all hover:brightness-110"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="hidden border border-stone-200 px-5 py-2 font-serif text-sm uppercase tracking-widest text-stone-600 transition-all hover:border-orange-700 hover:text-orange-700 lg:inline-block"
              >
                Join
              </Link>
            </div>
          )}

          <button
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
            className="text-on-surface-variant md:hidden"
          >
            {isOpen ? <X aria-hidden="true" size={24} strokeWidth={1.8} /> : <Menu aria-hidden="true" size={24} strokeWidth={1.8} />}
          </button>
        </div>
      </header>

      {isOpen && (
        <div className="fixed inset-x-0 top-[73px] z-40 border-b border-stone-200 bg-white/95 px-8 py-5 shadow-lg backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-4">
            {authLoading ? (
              [0, 1, 2, 3].map((item) => <div key={item} className="h-5 w-36 animate-pulse rounded bg-stone-200" />)
            ) : (
              navLinks.map((link) => {
                const active = isActivePath(pathname, link.href);
                const Icon = link.Icon;

                return (
                  <Link
                    key={`mobile-${link.label}-${link.href}`}
                    href={link.href}
                    onClick={closeMenus}
                    className={
                      active
                        ? "inline-flex items-center gap-2 font-serif text-sm uppercase tracking-widest text-orange-700 dark:text-orange-500"
                        : "inline-flex items-center gap-2 font-serif text-sm uppercase tracking-widest text-stone-600 transition-colors hover:text-orange-700 dark:text-stone-400"
                    }
                  >
                    <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                    {link.label}
                  </Link>
                );
              })
            )}

            {!authLoading && (isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 border border-red-200 px-6 py-2 text-center font-serif text-sm uppercase tracking-widest text-red-600 transition-all hover:bg-red-50"
              >
                <LogOut aria-hidden="true" size={18} strokeWidth={1.8} />
                Logout
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="bg-primary-container px-6 py-2 text-center font-serif text-sm uppercase tracking-widest text-on-primary-container transition-all hover:brightness-110"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenus}
                  className="inline-flex items-center justify-center gap-2 border border-stone-200 px-6 py-2 text-center font-serif text-sm uppercase tracking-widest text-stone-600 transition-all hover:border-orange-700 hover:text-orange-700"
                >
                  <UserPlus size={16} strokeWidth={1.8} />
                  Join
                </Link>
              </div>
            ))}
          </nav>
        </div>
      )}

      <nav className="fixed bottom-0 z-50 flex h-16 w-full items-center justify-around border-t border-stone-200 bg-white md:hidden">
        {authLoading ? (
          [0, 1, 2].map((item) => <div key={item} className="h-10 w-12 animate-pulse rounded bg-stone-200" />)
        ) : (
          bottomNavLinks.map((link) => {
            const active = isActivePath(pathname, link.href);
            const Icon = link.Icon;

            return (
              <Link
                key={`bottom-${link.label}-${link.href}`}
                href={link.href}
                className={
                  active
                    ? "flex flex-col items-center justify-center font-bold text-orange-700 dark:text-orange-500"
                    : "flex flex-col items-center justify-center text-stone-500 dark:text-stone-400"
                }
              >
                <Icon aria-hidden="true" size={23} strokeWidth={active ? 2.3 : 1.9} />
                <span className="font-serif text-[10px] font-medium">{link.shortLabel || link.label}</span>
              </Link>
            );
          })
        )}
      </nav>

      {!authLoading && (
        <div className="fixed bottom-24 right-6 z-40 md:right-12">
          <Link
            href={floatingAction.href}
            aria-label={floatingAction.label}
            className="flex h-14 w-14 items-center justify-center bg-primary-container text-on-primary-container shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <FloatingIcon aria-hidden="true" size={28} strokeWidth={2.2} />
          </Link>
        </div>
      )}
    </>
  );
}
