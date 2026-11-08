import React, { lazy, Suspense } from 'react';

const OrbitalGeometry = lazy(() => import('./orbital-geometry.jsx'));

// A decorative CSS scene; no canvas, render loop, or third-party 3D runtime.
export default function OrbitalScene() {
  return <div className="orbital-scene" aria-hidden="true">
    <Suspense fallback={<div className="orbital-scene__fallback" />}>
      <OrbitalGeometry />
    </Suspense>
  </div>;
}
