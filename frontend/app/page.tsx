import type { Metadata } from "next";
import Link from "next/link";
import { BandRail } from "@/components/features/landing/band-rail";
import { ReportCard } from "@/components/features/landing/report-card";
import "./landing.css";

export const metadata: Metadata = {
  title: "IELTS Mock — Know your band before exam day",
  description:
    "Sit a full IELTS Academic mock under real test conditions and get a predicted band with criterion-by-criterion feedback in about a minute.",
};

export default function Home() {
  return (
    <div className="landing">
      <nav>
        <div className="wrap nav-in">
          <Link className="brand" href="/">
            <span className="mark" />
            IELTS Mock
          </Link>
          <div className="nav-links">
            <a href="#sections">The sections</a>
            <a href="#how">How it works</a>
            <a href="#report">Band report</a>
            <Link href="/login">Sign in</Link>
            <Link className="btn btn-primary" href="/register">
              Start a free mock test
            </Link>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">IELTS Academic · timed &amp; AI-scored</span>
            <h1>
              Know your band <em>before</em> exam day.
            </h1>
            <p className="lede">
              Sit a full mock under real test conditions. Get a predicted band and
              criterion-by-criterion feedback in about a minute — not a week.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/register">
                Start a free mock test
              </Link>
              <a className="btn btn-ghost" href="#report">
                See a sample report →
              </a>
            </div>
            <div className="cta-row" style={{ marginTop: 22 }}>
              <span className="micro">
                <span className="dot" />
                No card required for your first test
              </span>
              <span className="micro mono">SCORED IN ~60s</span>
            </div>
          </div>

          {/* SIGNATURE: the band rail instrument */}
          <BandRail />
        </div>
      </header>

      <div className="ticker">
        <div className="wrap">
          <span>
            BUILT TO THE <b>ACADEMIC</b> FORMAT
          </span>
          <span>
            LISTENING <b>·</b> READING <b>·</b> WRITING <b>·</b> SPEAKING
          </span>
          <span>
            <b>9-BAND</b> SCALE, 0.5 STEPS
          </span>
          <span>
            FEEDBACK YOU CAN <b>ACT ON</b>
          </span>
        </div>
      </div>

      <section id="sections">
        <div className="wrap">
          <div className="head-row">
            <h2>Four sections. The same clock as the real thing.</h2>
            <p>
              Each mock runs on the official timing, so the pressure you practise under is
              the pressure you&apos;ll sit in.
            </p>
          </div>
          <div className="skills">
            <div className="skill">
              <span className="num">/ 01</span>
              <h3>Listening</h3>
              <p>Four recordings, forty questions, played once — exactly like the test.</p>
              <div className="time">
                <span>40 questions</span>
                <b>30:00</b>
              </div>
            </div>
            <div className="skill">
              <span className="num">/ 02</span>
              <h3>Reading</h3>
              <p>Three academic passages graded for difficulty, with the full question set.</p>
              <div className="time">
                <span>3 passages</span>
                <b>60:00</b>
              </div>
            </div>
            <div className="skill">
              <span className="num">/ 03</span>
              <h3>Writing</h3>
              <p>Task 1 report and Task 2 essay, scored on all four official criteria.</p>
              <div className="time">
                <span>2 tasks</span>
                <b>60:00</b>
              </div>
            </div>
            <div className="skill">
              <span className="num">/ 04</span>
              <h3>Speaking</h3>
              <p>A three-part interview you answer aloud, assessed for fluency and range.</p>
              <div className="time">
                <span>3 parts</span>
                <b>14:00</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="head-row">
            <h2>From sitting down to knowing your band.</h2>
            <p>A real sequence — each step feeds the next.</p>
          </div>
          <div className="steps">
            <div className="step">
              <span className="idx">1</span>
              <h3>Take the mock</h3>
              <p>Pick a section or sit the full test under the official timer.</p>
            </div>
            <div className="step">
              <span className="idx">2</span>
              <h3>Get scored</h3>
              <p>The AI marks your answers against the band descriptors in about a minute.</p>
            </div>
            <div className="step">
              <span className="idx">3</span>
              <h3>Read the feedback</h3>
              <p>See exactly where you lost marks, criterion by criterion.</p>
            </div>
            <div className="step">
              <span className="idx">4</span>
              <h3>Close the gap</h3>
              <p>Practise the weak section again and watch the band move.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="report" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="report-sec">
            <div className="wrap">
              <div className="report-grid">
                <div>
                  <span className="eyebrow">Your band report</span>
                  <h2 style={{ marginTop: 18 }}>A score is a verdict. This tells you why.</h2>
                  <p className="lede" style={{ maxWidth: "34ch" }}>
                    Every mock returns the artifact that matters: an overall band, broken
                    down by the same criteria an examiner uses.
                  </p>
                  <ul>
                    <li>Overall band on the 9-point scale</li>
                    <li>Per-criterion marks, not a single mystery number</li>
                    <li>The exact lines that cost you, quoted back</li>
                    <li>One thing to fix before your next attempt</li>
                  </ul>
                </div>
                <ReportCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="stat-row">
            <div className="stat">
              <div className="n">~60s</div>
              <div className="l">from final answer to a scored band report</div>
            </div>
            <div className="stat">
              <div className="n">4/4</div>
              <div className="l">official sections, on the official clock</div>
            </div>
            <div className="stat">
              <div className="n">0.5</div>
              <div className="l">band precision — the same granularity as the real result</div>
            </div>
          </div>
        </div>
      </section>

      <section id="start" className="final">
        <div className="wrap">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Free first mock
          </span>
          <h2 style={{ marginTop: 18 }}>Find out where you stand today.</h2>
          <p>Sit one section now. No card, no wait — just your band and what to do about it.</p>
          <div className="cta-row">
            <Link
              className="btn btn-primary"
              href="/register"
              style={{ padding: "14px 24px", fontSize: 16 }}
            >
              Start a free mock test
            </Link>
            <a className="btn btn-ghost" href="#sections">
              Browse the sections →
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot-in">
          <Link className="brand" href="/" style={{ fontSize: 17 }}>
            <span className="mark" style={{ width: 22, height: 22 }} />
            IELTS Mock
          </Link>
          <div className="foot-links">
            <a href="#sections">Sections</a>
            <a href="#how">How it works</a>
            <a href="#report">Band report</a>
            <Link href="/login">Sign in</Link>
          </div>
          <span className="mono" style={{ fontSize: 12 }}>
            BANDS ARE ESTIMATES · NOT AFFILIATED WITH THE IELTS PARTNERS
          </span>
        </div>
      </footer>
    </div>
  );
}
