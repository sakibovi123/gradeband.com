"use client";

import { useEffect, useRef } from "react";

type Criterion = { label: string; band: string; width: number };

const CRITERIA: Criterion[] = [
  { label: "Task achievement", band: "7.0", width: 78 },
  { label: "Coherence & cohesion", band: "6.5", width: 72 },
  { label: "Lexical resource", band: "6.0", width: 66 },
  { label: "Grammatical range", band: "6.0", width: 66 },
];

/**
 * Sample band report — the product's core artifact. The criterion bars fill in
 * when the card scrolls into view (or immediately under reduced-motion).
 */
export function ReportCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const bars = Array.from(card.querySelectorAll<HTMLElement>(".bar i"));
    const fill = () => bars.forEach((b) => (b.style.width = `${b.dataset.w}%`));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fill();
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            fill();
            io.disconnect();
          }
        }),
      { threshold: 0.3 },
    );
    io.observe(card);
    return () => io.disconnect();
  }, []);

  return (
    <div className="card" ref={cardRef}>
      <div className="card-top">
        <div>
          <div className="lbl">Writing · overall band</div>
          <div className="overall">
            6.5<span> / 9.0</span>
          </div>
        </div>
        <div className="lbl" style={{ textAlign: "right" }}>
          ATTEMPT&nbsp;#3
          <br />
          02 JUN 2026
        </div>
      </div>
      <div className="crit">
        {CRITERIA.map((c) => (
          <div className="crit-row" key={c.label}>
            <div className="cr-top">
              <span>{c.label}</span>
              <b>{c.band}</b>
            </div>
            <div className="bar">
              <i data-w={c.width} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
