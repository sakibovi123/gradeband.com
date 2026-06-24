"use client";

import { useEffect, useRef } from "react";

/**
 * The signature element: a vertical band-score rail (4.0 → 9.0) that animates
 * up to a predicted band on load, with a counting readout. Respects
 * prefers-reduced-motion by jumping straight to the final state.
 */
const TOP = 9;
const BOTTOM = 4;
const PREDICTED = 7.5;
const PCT = ((PREDICTED - BOTTOM) / (TOP - BOTTOM)) * 100;

export function BandRail() {
  const fillRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const apply = () => {
      if (fillRef.current) fillRef.current.style.height = `${PCT}%`;
      if (markerRef.current) {
        markerRef.current.style.bottom = `${PCT}%`;
        markerRef.current.dataset.band = PREDICTED.toFixed(1);
      }
      if (!readoutRef.current) return;
      if (reduce) {
        readoutRef.current.textContent = PREDICTED.toFixed(1);
        return;
      }
      let v = BOTTOM;
      const t = setInterval(() => {
        v += 0.1;
        if (v >= PREDICTED) {
          v = PREDICTED;
          clearInterval(t);
        }
        if (readoutRef.current) readoutRef.current.textContent = v.toFixed(1);
      }, 28);
    };

    if (reduce) {
      apply();
      return;
    }
    const id = window.setTimeout(apply, 350);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="instrument">
      <div className="inst-head">
        <span className="k">Predicted band</span>
        <span className="live">CALIBRATING</span>
      </div>
      <div className="rail">
        <div className="track">
          <div className="fill" ref={fillRef} />
          <div className="marker" ref={markerRef} data-band="–" />
        </div>
        <div className="ticks" aria-hidden="true">
          <span>9.0</span>
          <span>8.0</span>
          <span className="hot">7.5</span>
          <span>7.0</span>
          <span>6.0</span>
          <span>5.0</span>
          <span>4.0</span>
        </div>
      </div>
      <div className="inst-foot">
        <span>
          Target <b>7.0</b>
        </span>
        <span>
          Predicted <b ref={readoutRef}>–</b>
        </span>
      </div>
    </div>
  );
}
