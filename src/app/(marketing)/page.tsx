"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Inter, Newsreader } from "next/font/google";
import styles from "./landing-page.module.css";
import { initOrb } from "./orb";
import { NominatorRequestModal } from "./nominator-request-modal";
import { NominateSomeoneModal } from "./nominate-someone-modal";
import { Logo } from "@/components/logo";

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
  const [thesisExpanded, setThesisExpanded] = useState(false);
  const [scrollHintHidden, setScrollHintHidden] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const thesisElaborationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      const id = (window.location.hash || "#home").slice(1);
      setActivePage(isPageId(id) ? id : "home");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // When user navigates to thesis, watch for the elaboration scrolling into
  // view and reveal it with motion. Also auto-hide the scroll-hint chevron
  // after 3s. Reset both on leaving thesis so the animations re-arm.
  useEffect(() => {
    if (activePage !== "thesis") {
      setThesisExpanded(false);
      setScrollHintHidden(false);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });

    // Hide scroll hint after 3 seconds.
    const hintTimer = setTimeout(() => setScrollHintHidden(true), 3000);

    // Reveal elaboration when it scrolls into view.
    const el = thesisElaborationRef.current;
    if (!el) {
      return () => clearTimeout(hintTimer);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setThesisExpanded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => {
      clearTimeout(hintTimer);
      observer.disconnect();
    };
  }, [activePage]);

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
      <Link href="/" className={styles.brandSlot} aria-label="021 home">
        <Logo size="md" />
      </Link>

      <a className={styles.cornerLink} href="#" aria-hidden>
        <u>NY Times</u>
      </a>

      <div ref={tooltipRef} className={styles.orbTooltip} aria-hidden="true" />

      <div className={styles.beam} aria-hidden="true" />
      <div className={styles.horizon} aria-hidden="true" />

      <div className={styles.stage}>
        {/* HOME */}
        <section className={pageClass("home")}>
          <p className={styles.heroLine}>We back AI-Native humans under 18.</p>

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

        {/* THESIS — first view (existing two lines) + scroll-revealed elaboration */}
        <section className={pageClass("thesis")}>
          <div className={styles.thesisFirstView}>
            <div className={styles.thesisLines}>
              <h1 className={styles.thesisWord}>for AI-Native humans under 18.</h1>
              <h1 className={styles.thesisWord}>Ship every month. Eat the world.</h1>
            </div>
            <div
              className={`${styles.thesisScrollHint} ${scrollHintHidden ? styles.isHidden : ""}`}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div
            ref={thesisElaborationRef}
            className={`${styles.thesisElaboration} ${thesisExpanded ? styles.isThesisVisible : ""}`}
          >
            <div className={styles.thesisElaborationInner}>
              <span className={styles.thesisLine}>
                Most institutions wait until you graduate to take you
                seriously. We don&rsquo;t.
              </span>
              <span className={styles.thesisLine}>
                You don&rsquo;t need someone to teach you AI. You need peers,
                capital, and stakes.
              </span>
              <span className={`${styles.thesisLine} ${styles.thesisLineParaBreak}`}>
                Monthly venture cycle. Real rubric. Cash on the line.
                Nomination only.
              </span>
              <span className={styles.thesisLine}>
                If you want a class, a curriculum, or someone to walk you
                through your first project, this is the wrong door.
              </span>
            </div>
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
