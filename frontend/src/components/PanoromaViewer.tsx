"use client";

import { useState } from "react";
import { PanoViewer, PROJECTION_TYPE } from "@egjs/react-view360";
import type { ErrorEvent } from "@egjs/view360";

type PanoramaViewerProps = {
  imageUrl: string;
  title?: string;
};

export default function PanoramaViewer({
  imageUrl,
  title,
}: PanoramaViewerProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      {title && (
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
        </div>
      )}
      <PanoramaStage key={imageUrl} imageUrl={imageUrl} />
    </div>
  );
}

function PanoramaStage({ imageUrl }: Pick<PanoramaViewerProps, "imageUrl">) {
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div className="relative h-[360px] w-full bg-stone-950 md:h-[500px]">
      {!isReady && !errorMessage && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm font-medium text-stone-200">
          Loading 360 view...
        </div>
      )}

      {errorMessage && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <PanoViewer
        className="h-full w-full"
        canvasClass="h-full w-full"
        image={imageUrl}
        projectionType={PROJECTION_TYPE.EQUIRECTANGULAR}
        fov={75}
        yaw={-20}
        useZoom
        onReady={() => {
          setIsReady(true);
          setErrorMessage(null);
        }}
        onError={(event: ErrorEvent) => {
          setIsReady(false);
          setErrorMessage(
            event.message || "The panorama image could not be loaded."
          );
        }}
      />
    </div>
  );
}
