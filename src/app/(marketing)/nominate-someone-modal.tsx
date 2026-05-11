"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import styles from "./landing-page.module.css";

type ModalState =
  | { phase: "idle"; error?: string }
  | { phase: "submitting" }
  | { phase: "not_recognized" }
  | { phase: "done" };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestNominatorAccess: () => void;
}

export function NominateSomeoneModal({
  isOpen,
  onClose,
  onRequestNominatorAccess,
}: Props) {
  const submit = useMutation(api.nominators.nominateStudent);

  const [nominatorEmail, setNominatorEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nomineeEmail, setNomineeEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [links, setLinks] = useState("");
  const [state, setState] = useState<ModalState>({ phase: "idle" });

  useEffect(() => {
    if (isOpen) return;
    const t = setTimeout(() => {
      setNominatorEmail("");
      setFirstName("");
      setLastName("");
      setNomineeEmail("");
      setPhone("");
      setLinks("");
      setState({ phase: "idle" });
    }, 300);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.phase === "submitting") return;
    setState({ phase: "submitting" });

    const parsedLinks = links
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await submit({
        nominatorEmail: nominatorEmail.trim(),
        nomineeFirstName: firstName.trim(),
        nomineeLastName: lastName.trim(),
        nomineeEmail: nomineeEmail.trim(),
        nomineePhone: phone.trim() || undefined,
        nomineeLinks: parsedLinks.length > 0 ? parsedLinks : undefined,
      });
      setState({ phase: "done" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg.includes("NOMINATOR_NOT_FOUND")) {
        setState({ phase: "not_recognized" });
      } else {
        setState({ phase: "idle", error: msg });
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nominate-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {state.phase === "done" ? (
          <div className={styles.modalSuccess}>
            <h2 id="nominate-modal-title" className={styles.modalTitle}>
              Nomination sent.
            </h2>
            <p className={styles.modalSubtitle}>
              We&rsquo;ve emailed {firstName || "your nominee"} a private link
              to apply.
            </p>
            <button
              type="button"
              className={styles.modalPrimary}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : state.phase === "not_recognized" ? (
          <div className={styles.modalSuccess}>
            <h2 id="nominate-modal-title" className={styles.modalTitle}>
              We don&rsquo;t recognize that email.
            </h2>
            <p className={styles.modalSubtitle}>
              Nominations are limited to approved nominators. If you should be
              one, request access — we&rsquo;ll review and get back to you.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalSecondary}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalPrimary}
                onClick={onRequestNominatorAccess}
              >
                Request access
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <h2 id="nominate-modal-title" className={styles.modalTitle}>
              Nominate someone
            </h2>
            <p className={styles.modalSubtitle}>
              We&rsquo;ll email them a private link to apply.
            </p>

            <label className={styles.modalField}>
              <span>Your email</span>
              <input
                type="email"
                value={nominatorEmail}
                onChange={(e) => setNominatorEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
              />
            </label>

            <label className={styles.modalField}>
              <span>Nominee first name</span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="First"
              />
            </label>

            <label className={styles.modalField}>
              <span>Nominee last name</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Last"
              />
            </label>

            <label className={styles.modalField}>
              <span>Nominee email</span>
              <input
                type="email"
                value={nomineeEmail}
                onChange={(e) => setNomineeEmail(e.target.value)}
                required
                placeholder="them@example.com"
              />
            </label>

            <label className={styles.modalField}>
              <span>Nominee phone</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="optional"
              />
            </label>

            <label className={styles.modalField}>
              <span>Links</span>
              <textarea
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                rows={2}
                placeholder="optional — comma-separated URLs (LinkedIn, portfolio, etc.)"
              />
            </label>

            {state.phase === "idle" && state.error && (
              <p className={styles.modalError}>{state.error}</p>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalSecondary}
                onClick={onClose}
                disabled={state.phase === "submitting"}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.modalPrimary}
                disabled={state.phase === "submitting"}
              >
                {state.phase === "submitting" ? "Sending…" : "Send nomination"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
