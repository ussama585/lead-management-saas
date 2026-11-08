import React from 'react';

export default function OrbitalGeometry() {
  return <div className="orbital-scene__object">
    <div className="orbital-scene__ring orbital-scene__ring--one" />
    <div className="orbital-scene__ring orbital-scene__ring--two" />
    <div className="orbital-scene__ring orbital-scene__ring--three" />
    <div className="orbital-scene__core" />
    <div className="orbital-scene__satellite" />
    <div className="orbital-scene__satellite orbital-scene__satellite--small" />
  </div>;
}
