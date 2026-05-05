"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { getExperience } from "@/lib/api";

interface ViewerExperience {
  id: string;
  title: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  panorama_images?: string[];
}

interface PanoramaViewerProps {
  backHref?: string;
  backLabel?: string;
  directUrl?: string | null;
  experienceId?: string | null;
  titleParam?: string | null;
}

const fallbackViews = [
  {
    label: "Fallback Panorama",
    url: "https://www.360cities.net/embed_iframe/bhaktapur-durbar-square",
  },
];

function normalizePanoramaUrl(value: string) {
  const srcMatch = value.match(/src=["']([^"']+)["']/i);
  const rawUrl = srcMatch?.[1] || value.trim();

  try {
    const url = new URL(rawUrl);

    if (url.hostname.includes("360cities.net")) {
      const segments = url.pathname.split("/").filter(Boolean);
      const embedIndex = segments.indexOf("embed_iframe");

      if (embedIndex >= 0 && segments[embedIndex + 1]) {
        return `https://www.360cities.net/embed_iframe/${segments[embedIndex + 1]}`;
      }

      const imageIndex = segments.lastIndexOf("image");
      if (imageIndex >= 0 && segments[imageIndex + 1]) {
        return `https://www.360cities.net/embed_iframe/${segments[imageIndex + 1]}`;
      }
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

function buildMapUrl(experience: ViewerExperience | null) {
  if (typeof experience?.latitude !== "number" || typeof experience.longitude !== "number") {
    return "";
  }

  return `https://maps.google.com/maps?q=${experience.latitude},${experience.longitude}&z=16&output=embed`;
}

export function PanoramaViewer({
  backHref,
  backLabel = "Back to Experience",
  directUrl,
  experienceId,
  titleParam,
}: PanoramaViewerProps) {
  const [experience, setExperience] = useState<ViewerExperience | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(experienceId));

  useEffect(() => {
    async function loadExperience() {
      if (!experienceId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const res = await getExperience(experienceId);
      if (res?.data) {
        setExperience(res.data);
      }
      setActiveIndex(0);
      setIsLoading(false);
    }

    loadExperience();
  }, [experienceId]);

  const views = useMemo(() => {
    const panoramaViews = (experience?.panorama_images || []).map((url, index) => ({
      label: `Panorama ${index + 1}`,
      type: "panorama",
      url: normalizePanoramaUrl(url),
    }));

    const mapUrl = buildMapUrl(experience);
    const mapView = mapUrl ? [{ label: "Location Map", type: "map", url: mapUrl }] : [];

    if (panoramaViews.length || mapView.length) return [...panoramaViews, ...mapView];
    if (directUrl) return [{ label: "Panorama", type: "panorama", url: normalizePanoramaUrl(directUrl) }];
    return fallbackViews.map((view) => ({ ...view, type: "panorama" }));
  }, [directUrl, experience]);

  const activeView = views[activeIndex] || views[0];
  const activeUrl = activeView.url;
  const viewerTitle = experience?.title || titleParam || "360 Heritage Preview";
  const resolvedBackHref = backHref || (experienceId ? `/experience/${experienceId}` : "/marketplace");

  const goToPrevious = () => {
    setActiveIndex((current) => (current === 0 ? views.length - 1 : current - 1));
  };

  const goToNext = () => {
    setActiveIndex((current) => (current === views.length - 1 ? 0 : current + 1));
  };

  return (
    <div className="min-h-screen pt-20" style={{ background: "var(--himalayan-cream)" }}>
      <header className="px-4 py-5 sm:px-6 lg:px-8" style={{ background: "var(--deep-indigo)" }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href={resolvedBackHref} className="text-sm hover:underline" style={{ color: "rgba(245, 240, 235, 0.72)" }}>
              ← {backLabel}
            </Link>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: "var(--himalayan-white)", fontFamily: "var(--font-heading)" }}>
              {viewerTitle}
            </h1>
            {experience?.location_name && (
              <p className="mt-1 text-sm" style={{ color: "rgba(245, 240, 235, 0.72)" }}>
                {experience.location_name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {views.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-85"
                  style={{ background: "rgba(255,255,255,0.12)", color: "var(--himalayan-white)" }}
                >
                  Previous View
                </button>
                <span className="min-w-14 text-center text-sm" style={{ color: "rgba(245, 240, 235, 0.8)" }}>
                  {activeIndex + 1}/{views.length}
                </span>
                <button
                  type="button"
                  onClick={goToNext}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-85"
                  style={{ background: "var(--temple-gold)", color: "var(--deep-indigo)" }}
                >
                  Next View
                </button>
              </>
            )}
            <a
              href={activeUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: "rgba(255,255,255,0.12)", color: "var(--himalayan-white)" }}
            >
              Open Original
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold" style={{ color: "var(--deep-indigo)", fontFamily: "var(--font-heading)" }}>
            {activeView.label}
          </span>
          {views.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {views.map((view, index) => (
                <button
                  key={`${view.label}-${view.url}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: activeIndex === index ? "var(--terracotta)" : "rgba(27, 42, 74, 0.08)",
                    color: activeIndex === index ? "white" : "var(--deep-indigo)",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  {view.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-[70vh] items-center justify-center rounded-xl bg-white/50">
            <div className="spinner" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-black shadow-lg">
            <iframe
              key={activeUrl}
              src={activeUrl}
              title={`${viewerTitle} ${activeView.label}`}
              className="h-[72vh] min-h-[520px] w-full border-0"
              loading="lazy"
              allow="fullscreen; accelerometer; gyroscope; magnetometer"
              allowFullScreen
            />
          </div>
        )}
      </main>
    </div>
  );
}
