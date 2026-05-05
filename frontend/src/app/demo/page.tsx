"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { PanoramaViewer } from "@/components/experience/PanoramaViewer";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: "var(--himalayan-cream)" }}>
        <div className="spinner" />
      </div>
    }>
      <DemoCompatibilityPage />
    </Suspense>
  );
}

function DemoCompatibilityPage() {
  const searchParams = useSearchParams();
  const experienceId = searchParams.get("experienceId");

  return (
    <PanoramaViewer
      backHref={experienceId ? `/experience/${experienceId}` : "/marketplace"}
      backLabel="Back to Experience"
      directUrl={searchParams.get("url")}
      experienceId={experienceId}
      titleParam={searchParams.get("title")}
    />
  );
}
