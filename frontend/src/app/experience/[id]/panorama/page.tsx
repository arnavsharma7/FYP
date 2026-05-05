"use client";

import { use } from "react";

import { PanoramaViewer } from "@/components/experience/PanoramaViewer";

export default function ExperiencePanoramaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <PanoramaViewer
      backHref={`/experience/${id}`}
      backLabel="Back to Experience"
      experienceId={id}
    />
  );
}
