"use client";

import { useRef, useEffect, useState } from "react";

interface MapPin {
    id: string;
    lat: number;
    lng: number;
    title: string;
    category: string;
    rating?: number;
}

interface InteractiveMapProps {
    pins?: MapPin[];
    center?: { lat: number; lng: number };
    zoom?: number;
    height?: string;
}

const defaultPins: MapPin[] = [
    { id: "1", lat: 27.7172, lng: 85.3240, title: "Kathmandu Valley", category: "heritage_site", rating: 4.8 },
    { id: "2", lat: 28.2096, lng: 83.9856, title: "Pokhara", category: "guide", rating: 4.9 },
    { id: "3", lat: 27.6710, lng: 85.4298, title: "Bhaktapur", category: "workshop", rating: 4.8 },
    { id: "4", lat: 27.6588, lng: 85.3247, title: "Patan", category: "heritage_site", rating: 4.7 },
    { id: "5", lat: 28.3949, lng: 83.9446, title: "Ghandruk", category: "homestay", rating: 4.8 },
    { id: "6", lat: 27.9881, lng: 86.9250, title: "Everest Region", category: "guide", rating: 5.0 },
    { id: "7", lat: 27.4833, lng: 83.2767, title: "Lumbini", category: "heritage_site", rating: 4.8 },
    { id: "8", lat: 28.1700, lng: 85.5800, title: "Langtang", category: "guide", rating: 4.7 },
];

const categoryColors: Record<string, string> = {
    homestay: "#8B6F47",
    guide: "#2D5016",
    workshop: "#8B3A6A",
    heritage_site: "#1B2A4A",
};

const categoryIcons: Record<string, string> = {
    homestay: "🏡",
    guide: "🧭",
    workshop: "🎨",
    heritage_site: "🏛️",
};

/**
 * Interactive Map Component
 * Renders an SVG-based map of Nepal with interactive pins.
 * In production, this would integrate with Mapbox GL JS.
 */
export default function InteractiveMap({
    pins = defaultPins,
    center = { lat: 28.2, lng: 84.5 },
    zoom = 1,
    height = "500px",
}: InteractiveMapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredPin, setHoveredPin] = useState<string | null>(null);
    const [selectedPin, setSelectedPin] = useState<string | null>(null);

    // Convert lat/lng to SVG coordinates (simplified projection for Nepal)
    const toSVG = (lat: number, lng: number) => {
        const x = ((lng - 80) / (89 - 80)) * 900 + 50;
        const y = ((30 - lat) / (30 - 26)) * 400 + 50;
        return { x: x * zoom, y: y * zoom };
    };

    return (
        <div className="relative rounded-2xl overflow-hidden glass-card" style={{ height }}>
            {/* Map Header */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <span className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ background: "rgba(0,0,0,0.6)", color: "white", fontFamily: "var(--font-heading)" }}>
                    🗺️ Interactive Heritage Map
                </span>
            </div>

            {/* Legend */}
            <div className="absolute top-3 right-3 z-10 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                <div className="text-xs font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Categories</div>
                <div className="space-y-1">
                    {Object.entries(categoryIcons).map(([key, icon]) => (
                        <div key={key} className="flex items-center gap-1.5 text-xs" style={{ color: categoryColors[key] }}>
                            <span>{icon}</span>
                            <span className="capitalize">{key.replace("_", " ")}</span>
                        </div>
                    ))}
                </div>
            </div>

            <svg
                ref={svgRef}
                viewBox="0 0 1000 500"
                className="w-full h-full"
                style={{ background: "linear-gradient(135deg, #E8DCC8, #F5F0EB)" }}
            >
                {/* Nepal outline (simplified) */}
                <path
                    d="M120,200 L180,180 L220,190 L280,170 L340,175 L390,160 L440,165 L490,145 L530,150 L570,140 L630,150 L680,155 L730,140 L780,155 L820,170 L850,190 L870,210 L860,240 L830,260 L790,280 L740,295 L680,310 L620,315 L560,320 L500,310 L440,300 L380,290 L320,280 L260,270 L200,260 L150,240 L120,220 Z"
                    fill="rgba(45, 80, 22, 0.08)"
                    stroke="rgba(45, 80, 22, 0.3)"
                    strokeWidth="2"
                />

                {/* Mountain range indicator */}
                <path
                    d="M350,170 L380,140 L410,165 L440,130 L470,160 L500,120 L530,155 L560,135 L590,150 L620,145 L650,155"
                    fill="none"
                    stroke="rgba(139, 111, 71, 0.2)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                />

                {/* Region labels */}
                <text x="250" y="250" fill="rgba(27, 42, 74, 0.15)" fontSize="18" fontFamily="var(--font-heading)" fontWeight="bold">
                    Western Nepal
                </text>
                <text x="500" y="220" fill="rgba(27, 42, 74, 0.15)" fontSize="18" fontFamily="var(--font-heading)" fontWeight="bold">
                    Central Nepal
                </text>
                <text x="730" y="230" fill="rgba(27, 42, 74, 0.15)" fontSize="18" fontFamily="var(--font-heading)" fontWeight="bold">
                    Eastern Nepal
                </text>

                {/* Connection lines between nearby pins */}
                {pins.map((pin, i) => {
                    const pos = toSVG(pin.lat, pin.lng);
                    return pins.slice(i + 1).map((pin2, j) => {
                        const pos2 = toSVG(pin2.lat, pin2.lng);
                        const dist = Math.sqrt(Math.pow(pos.x - pos2.x, 2) + Math.pow(pos.y - pos2.y, 2));
                        if (dist < 200) {
                            return (
                                <line
                                    key={`line-${i}-${j}`}
                                    x1={pos.x}
                                    y1={pos.y}
                                    x2={pos2.x}
                                    y2={pos2.y}
                                    stroke="rgba(196, 90, 60, 0.1)"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                />
                            );
                        }
                        return null;
                    });
                })}

                {/* Pins */}
                {pins.map(pin => {
                    const pos = toSVG(pin.lat, pin.lng);
                    const isHovered = hoveredPin === pin.id;
                    const isSelected = selectedPin === pin.id;
                    const color = categoryColors[pin.category] || "#1B2A4A";

                    return (
                        <g
                            key={pin.id}
                            onMouseEnter={() => setHoveredPin(pin.id)}
                            onMouseLeave={() => setHoveredPin(null)}
                            onClick={() => setSelectedPin(selectedPin === pin.id ? null : pin.id)}
                            style={{ cursor: "pointer" }}
                        >
                            {/* Pulse ring */}
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={isHovered || isSelected ? 18 : 12}
                                fill={`${color}20`}
                                stroke={`${color}40`}
                                strokeWidth="1"
                            >
                                <animate attributeName="r" from="12" to="20" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                            </circle>

                            {/* Pin circle */}
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={isHovered || isSelected ? 10 : 7}
                                fill={color}
                                stroke="white"
                                strokeWidth="2.5"
                                style={{ transition: "r 0.2s ease" }}
                            />

                            {/* Category icon (shown on hover) */}
                            {(isHovered || isSelected) && (
                                <text
                                    x={pos.x}
                                    y={pos.y + 4}
                                    textAnchor="middle"
                                    fontSize="10"
                                >
                                    {categoryIcons[pin.category]}
                                </text>
                            )}

                            {/* Tooltip */}
                            {(isHovered || isSelected) && (
                                <g>
                                    <rect
                                        x={pos.x - 60}
                                        y={pos.y - 50}
                                        width="120"
                                        height="32"
                                        rx="6"
                                        fill="white"
                                        stroke={`${color}40`}
                                        strokeWidth="1"
                                        filter="url(#shadow)"
                                    />
                                    <text
                                        x={pos.x}
                                        y={pos.y - 36}
                                        textAnchor="middle"
                                        fontSize="10"
                                        fontWeight="bold"
                                        fill={color}
                                        fontFamily="var(--font-heading)"
                                    >
                                        {pin.title}
                                    </text>
                                    {pin.rating && (
                                        <text
                                            x={pos.x}
                                            y={pos.y - 24}
                                            textAnchor="middle"
                                            fontSize="9"
                                            fill="#8B6F47"
                                        >
                                            ⭐ {pin.rating}
                                        </text>
                                    )}
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Shadow filter */}
                <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.15)" />
                    </filter>
                </defs>
            </svg>

            {/* Selected pin detail */}
            {selectedPin && (
                <div className="absolute bottom-4 left-4 right-4 z-10 p-4 rounded-xl animate-fade-in-up"
                    style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                    {(() => {
                        const pin = pins.find(p => p.id === selectedPin);
                        if (!pin) return null;
                        return (
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span>{categoryIcons[pin.category]}</span>
                                        <h4 className="font-bold text-sm" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>{pin.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--slate-medium)" }}>
                                        <span className="capitalize">{pin.category.replace("_", " ")}</span>
                                        {pin.rating && <span>⭐ {pin.rating}</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPin(null)}
                                    className="text-xs px-3 py-1.5 rounded-full"
                                    style={{ background: "rgba(196, 90, 60, 0.1)", color: "var(--terracotta)", fontFamily: "var(--font-heading)" }}
                                >
                                    Close ✕
                                </button>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
