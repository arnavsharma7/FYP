"use client";

import { useEffect, useMemo } from "react";
import { divIcon, type LatLngExpression } from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

type LocationPickerMapProps = {
  latitude: number;
  longitude: number;
  onPick: (latitude: number, longitude: number) => void;
};

function MapClickHandler({ onPick }: { onPick: LocationPickerMapProps["onPick"] }) {
  useMapEvents({
    click(event) {
      onPick(
        Number(event.latlng.lat.toFixed(6)),
        Number(event.latlng.lng.toFixed(6))
      );
    },
  });

  return null;
}

function RecenterMap({ center }: { center: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 11), { animate: true });
  }, [center, map]);

  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onPick,
}: LocationPickerMapProps) {
  const position: [number, number] = [latitude, longitude];
  const markerIcon = useMemo(
    () =>
      divIcon({
        className: "provider-map-marker",
        html: `
        <div style="position:relative;width:28px;height:28px;">
          <div style="position:absolute;inset:0;border-radius:9999px;background:#111827;opacity:.92;box-shadow:0 0 0 5px rgba(17,24,39,.16);"></div>
          <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:9999px;background:white;"></div>
        </div>
      `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    []
  );

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300">
      <MapContainer center={position} zoom={12} className="h-72 w-full md:h-80">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={markerIcon} />
        <MapClickHandler onPick={onPick} />
        <RecenterMap center={position} />
      </MapContainer>
    </div>
  );
}
