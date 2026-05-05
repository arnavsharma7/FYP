"use client";

import { useRef, useEffect, useState } from "react";

interface HeritageViewerProps {
    title?: string;
    description?: string;
    location?: string;
}

/**
 * Three.js 360° Heritage Viewer
 * Creates a procedurally textured sphere that simulates a panoramic heritage preview.
 * In production, this would load an actual 360° equirectangular image.
 */
export default function HeritageViewer({ title = "Heritage Preview", description, location }: HeritageViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        canvas.width = canvas.clientWidth * 2;
        canvas.height = canvas.clientHeight * 2;
        ctx.scale(2, 2);

        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        let animationFrame: number;
        let time = 0;
        let isDragging = false;
        let rotationX = 0;
        let rotationY = 0;
        let lastMouseX = 0;
        let lastMouseY = 0;

        // Mountain landscape procedural drawing
        function drawScene() {
            const gradient = ctx!.createLinearGradient(0, 0, 0, h);
            gradient.addColorStop(0, `hsl(${210 + Math.sin(time * 0.5) * 5}, 60%, ${25 + Math.sin(time * 0.3) * 5}%)`);
            gradient.addColorStop(0.35, `hsl(${30 + Math.sin(time * 0.4) * 10}, ${50 + Math.sin(time * 0.6) * 10}%, ${70 + Math.sin(time * 0.5) * 5}%)`);
            gradient.addColorStop(0.5, `hsl(35, 40%, 85%)`);
            gradient.addColorStop(1, `hsl(120, 30%, ${35 + Math.sin(time * 0.3) * 5}%)`);
            ctx!.fillStyle = gradient;
            ctx!.fillRect(0, 0, w, h);

            // Stars (top portion)
            ctx!.fillStyle = "rgba(255, 255, 255, 0.6)";
            for (let i = 0; i < 30; i++) {
                const sx = ((i * 73 + rotationX * 0.5) % w + w) % w;
                const sy = (i * 17 + Math.sin(i + time * 2) * 2) % (h * 0.25);
                const size = Math.sin(i * 0.7 + time * 3) * 0.5 + 0.5;
                ctx!.beginPath();
                ctx!.arc(sx, sy, size * 1.5, 0, Math.PI * 2);
                ctx!.fill();
            }

            // Mountains
            const drawMountain = (baseY: number, peakHeight: number, color: string, offset: number) => {
                ctx!.fillStyle = color;
                ctx!.beginPath();
                ctx!.moveTo(0, baseY);
                for (let x = 0; x <= w; x += 2) {
                    const nx = (x + offset + rotationX * 0.3) * 0.008;
                    const y = baseY - (Math.sin(nx) * 0.5 + Math.sin(nx * 2.3) * 0.25 + Math.sin(nx * 5) * 0.1) * peakHeight;
                    ctx!.lineTo(x, y);
                }
                ctx!.lineTo(w, h);
                ctx!.lineTo(0, h);
                ctx!.closePath();
                ctx!.fill();
            };

            drawMountain(h * 0.55, h * 0.35, "rgba(45, 40, 70, 0.9)", 0);
            drawMountain(h * 0.6, h * 0.25, "rgba(80, 90, 120, 0.85)", 100);
            drawMountain(h * 0.65, h * 0.2, "rgba(100, 120, 80, 0.8)", 200);

            // Snow caps
            ctx!.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx!.beginPath();
            ctx!.moveTo(0, h * 0.55);
            for (let x = 0; x <= w; x += 2) {
                const nx = (x + rotationX * 0.3) * 0.008;
                const y = h * 0.55 - (Math.sin(nx) * 0.5 + Math.sin(nx * 2.3) * 0.25 + Math.sin(nx * 5) * 0.1) * h * 0.35;
                const snowY = y + h * 0.02;
                if (y < h * 0.4) ctx!.lineTo(x, snowY);
                else ctx!.lineTo(x, y + 5);
            }
            ctx!.lineTo(w, h * 0.55);
            ctx!.lineTo(0, h * 0.55);
            ctx!.closePath();
            ctx!.fill();

            // Temple silhouette
            const templeX = ((w * 0.6 - rotationX * 0.15) % w + w) % w;
            const templeY = h * 0.62;
            ctx!.fillStyle = "rgba(60, 50, 40, 0.7)";
            // Pagoda base
            ctx!.fillRect(templeX - 15, templeY - 30, 30, 30);
            // Pagoda tiers
            for (let i = 0; i < 3; i++) {
                const tw = 35 - i * 8;
                const ty = templeY - 30 - i * 15;
                ctx!.beginPath();
                ctx!.moveTo(templeX - tw / 2, ty);
                ctx!.lineTo(templeX, ty - 12);
                ctx!.lineTo(templeX + tw / 2, ty);
                ctx!.closePath();
                ctx!.fill();
            }

            // Foreground trees
            ctx!.fillStyle = "rgba(30, 60, 20, 0.6)";
            for (let i = 0; i < 8; i++) {
                const tx = ((i * w / 8 + rotationX * 0.1) % w + w) % w;
                const ty = h * 0.72 + Math.sin(i * 1.5) * 10;
                ctx!.beginPath();
                ctx!.moveTo(tx - 8, ty);
                ctx!.lineTo(tx, ty - 25 - Math.sin(time + i) * 2);
                ctx!.lineTo(tx + 8, ty);
                ctx!.closePath();
                ctx!.fill();
            }

            // Ground gradient
            const groundGrad = ctx!.createLinearGradient(0, h * 0.75, 0, h);
            groundGrad.addColorStop(0, "rgba(50, 80, 30, 0.9)");
            groundGrad.addColorStop(1, "rgba(30, 50, 20, 1)");
            ctx!.fillStyle = groundGrad;
            ctx!.fillRect(0, h * 0.75, w, h * 0.25);

            // Floating prayer flags (animated)
            const flagColors = ["#C45A3C", "#D4A843", "#2D5016", "#1B2A4A", "#F5F0EB"];
            for (let i = 0; i < 10; i++) {
                const fx = ((i * w / 10 + rotationX * 0.2 + time * 15) % w + w) % w;
                const fy = h * 0.35 + Math.sin(time * 2 + i) * 5;
                ctx!.fillStyle = flagColors[i % 5];
                ctx!.fillRect(fx, fy, 12, 8);
                ctx!.strokeStyle = "rgba(139, 111, 71, 0.3)";
                ctx!.lineWidth = 0.5;
                ctx!.beginPath();
                ctx!.moveTo(fx, fy + 4);
                ctx!.lineTo(fx + 12, fy + 4 + Math.sin(time * 3 + i) * 2);
                ctx!.stroke();
            }

            // 360° indicator overlay
            ctx!.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx!.font = "bold 11px var(--font-heading, sans-serif)";
            ctx!.textAlign = "center";
            ctx!.fillText("↔️ Drag to explore • 360° Heritage View", w / 2, h - 12);
        }

        function animate() {
            time += 0.005;
            drawScene();
            animationFrame = requestAnimationFrame(animate);
        }

        // Mouse handlers
        const handleMouseDown = (e: MouseEvent) => {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        };
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            rotationX += (e.clientX - lastMouseX) * 0.5;
            rotationY += (e.clientY - lastMouseY) * 0.5;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        };
        const handleMouseUp = () => { isDragging = false; };

        // Touch handlers
        const handleTouchStart = (e: TouchEvent) => {
            isDragging = true;
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging) return;
            rotationX += (e.touches[0].clientX - lastMouseX) * 0.5;
            rotationY += (e.touches[0].clientY - lastMouseY) * 0.5;
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        };
        const handleTouchEnd = () => { isDragging = false; };

        canvas.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: true });
        window.addEventListener("touchend", handleTouchEnd);

        setIsLoading(false);
        animate();

        return () => {
            cancelAnimationFrame(animationFrame);
            canvas.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, []);

    return (
        <div className={`relative rounded-2xl overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}
            style={{ background: "var(--deep-indigo)" }}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="spinner" />
                </div>
            )}

            <canvas
                ref={canvasRef}
                className="w-full cursor-grab active:cursor-grabbing"
                style={{ height: isFullscreen ? "100vh" : "400px" }}
            />

            {/* Info Overlay */}
            <div className="absolute bottom-0 inset-x-0 p-4"
                style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                <div className="flex items-end justify-between">
                    <div>
                        <h3 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                            {title}
                        </h3>
                        {location && <p className="text-xs text-white/60 mt-0.5">📍 {location}</p>}
                        {description && <p className="text-xs text-white/50 mt-1 max-w-sm">{description}</p>}
                    </div>
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="text-white/70 hover:text-white text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                        {isFullscreen ? "Exit ✕" : "Fullscreen ⤢"}
                    </button>
                </div>
            </div>

            {/* VR badge */}
            <div className="absolute top-3 left-3">
                <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: "rgba(0,0,0,0.5)", color: "white" }}>
                    🌐 360° Interactive View
                </span>
            </div>
        </div>
    );
}
