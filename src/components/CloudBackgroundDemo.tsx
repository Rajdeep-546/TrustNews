import React from 'react';
import CloudBackground from "@/registry/ruixenui/cloud-background";

export default function DemoOne() {
  return (
    <div className="relative min-h-[420px] w-full rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl">
      <CloudBackground className="h-full min-h-[420px]" dim={0.65} speed={0.5} blurLevel="md">
        <div className="flex flex-col items-center justify-center min-h-[420px] text-center p-6 space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 shadow-lg">
            Ruixen UI · Cloud Background Active
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
            Dimmed &amp; Sliding Blur Atmosphere
          </h2>
          <p className="text-sm text-neutral-300 max-w-lg leading-relaxed">
            Procedural WebGL volumetric clouds with gentle atmospheric wind drift, subtle cursor parallax, and smooth backdrop blur.
          </p>
        </div>
      </CloudBackground>
    </div>
  );
}
