"use client";

import { useEffect, useRef, useState } from "react";
import { Inter, Newsreader } from "next/font/google";
import styles from "./landing-page.module.css";
import { initOrb } from "./orb";
import { NominatorRequestModal } from "./nominator-request-modal";
import { NominateSomeoneModal } from "./nominate-someone-modal";

const arenaSans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-arena-sans",
});
const arenaSerif = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-arena-serif",
});

type PageId = "home" | "thesis" | "team";
const PAGES: readonly PageId[] = ["home", "thesis", "team"];

function isPageId(id: string): id is PageId {
  return (PAGES as readonly string[]).includes(id);
}

export default function ArenaLandingPage() {
  const [activePage, setActivePage] = useState<PageId>("home");
  const [nominatorModalOpen, setNominatorModalOpen] = useState(false);
  const [nominateModalOpen, setNominateModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      const id = (window.location.hash || "#home").slice(1);
      setActivePage(isPageId(id) ? id : "home");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    initOrb(canvas, tooltip)
      .then((disposer) => {
        if (cancelled) {
          disposer();
        } else {
          cleanup = disposer;
        }
      })
      .catch((err) => {
        console.warn("Orb init failed:", err);
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  const navLink = (id: PageId, label: string) => (
    <a
      href={`#${id}`}
      className={activePage === id ? styles.isActive : ""}
      data-page={id}
    >
      {label}
    </a>
  );

  const pageClass = (id: PageId) =>
    `${styles.page} ${styles[id]} ${activePage === id ? styles.isActive : ""}`;

  return (
    <div
      className={`${arenaSans.variable} ${arenaSerif.variable} ${styles.root}`}
    >
      <a className={styles.cornerLink} href="#" aria-hidden>
        <u>NY Times</u>
      </a>

      <div ref={tooltipRef} className={styles.orbTooltip} aria-hidden="true" />

      <div className={styles.beam} aria-hidden="true" />
      <div className={styles.horizon} aria-hidden="true" />

      <div className={styles.stage}>
        {/* HOME */}
        <section className={pageClass("home")}>
          <p className={styles.heroLine}>The Teenage Venture Studio.</p>

          <div className={styles.orb}>
            <canvas
              ref={canvasRef}
              className={styles.orbCanvas}
              aria-hidden="true"
            />
          </div>

          <button
            type="button"
            className={styles.ctaButton}
            onClick={() => setNominateModalOpen(true)}
          >
            Nominate Someone
          </button>
        </section>

        {/* THESIS */}
        <section className={pageClass("thesis")}>
          <div className={styles.thesisLines}>
            <h1 className={styles.thesisWord}>The future belongs to the young.</h1>
            <h1 className={styles.thesisWord}>Underestimate them at your peril.</h1>
          </div>
        </section>

        {/* TEAM */}
        <section className={pageClass("team")}>
          <div className={styles.teamGrid}>
            <div className={styles.teamMember}>
              <p className={styles.teamName}>Connor Dore</p>
              <p className={styles.teamRole}>President</p>
            </div>
            <div className={styles.teamMember}>
              <p className={styles.teamName}>Jonah Elliott</p>
              <p className={styles.teamRole}>Builder</p>
            </div>
            <div className={styles.teamMember}>
              <p className={styles.teamName}>Braden Peays</p>
              <p className={styles.teamRole}>VP, Operations</p>
            </div>
            <div className={styles.teamMember}>
              <p className={styles.teamName}>Jake Oswald</p>
              <p className={styles.teamRole}>Advisor</p>
            </div>
          </div>
        </section>
      </div>

      <nav className={styles.nav} aria-label="primary">
        {navLink("home", "Home")}
        {navLink("thesis", "Thesis")}
        {navLink("team", "Team")}
        <a href="/login">Login</a>
      </nav>

      <div className={styles.whisper}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setNominatorModalOpen(true);
          }}
        >
          request to become a nominator
        </a>
      </div>

      <NominateSomeoneModal
        isOpen={nominateModalOpen}
        onClose={() => setNominateModalOpen(false)}
        onRequestNominatorAccess={() => {
          setNominateModalOpen(false);
          setNominatorModalOpen(true);
        }}
      />

      <NominatorRequestModal
        isOpen={nominatorModalOpen}
        onClose={() => setNominatorModalOpen(false)}
      />
    </div>
  );
}
