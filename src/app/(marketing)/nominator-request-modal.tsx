"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import styles from "./landing-page.module.css";

type ModalState =
  | { phase: "idle"; error?: string }
  | { phase: "submitting" }
  | { phase: "done" };

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NominatorRequestModal({ isOpen, onClose }: Props) {
  const submit = useMutation(api.nominators.requestToBecomeNominator);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<ModalState>({ phase: "idle" });

  // Reset on close. Small delay so the user doesn't see the form clear mid-fade.
  useEffect(() => {
    if (isOpen) return;
    const t = setTimeout(() => {
      setFullName("");
      setEmail("");
      setPhone("");
      setLinkedinUrl("");
      setNote("");
      setState({ phase: "idle" });
    }, 300);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Escape to close
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
    try {
      await submit({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        note: note.trim() || undefined,
      });
      setState({ phase: "done" });
    } catch (err) {
      setState({
        phase: "idle",
        error: err instanceof Error ? err.message : "Something went wrong.",
      });
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
        aria-labelledby="nom-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {state.phase === "done" ? (
          <div className={styles.modalSuccess}>
            <h2 id="nom-modal-title" className={styles.modalTitle}>
              Got it.
            </h2>
            <p className={styles.modalSubtitle}>
              We&rsquo;ll be in touch.
            </p>
            <button
              type="button"
              className={styles.modalPrimary}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <h2 id="nom-modal-title" className={styles.modalTitle}>
              Request to nominate
            </h2>
            <p className={styles.modalSubtitle}>
              Tell us who you are. If you check out, you&rsquo;ll get a private
              link to nominate students.
            </p>

            <label className={styles.modalField}>
              <span>Name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
                placeholder="First Last"
              />
            </label>

            <label className={styles.modalField}>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </label>

            <label className={styles.modalField}>
              <span>Phone</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="optional"
              />
            </label>

            <label className={styles.modalField}>
              <span>LinkedIn</span>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/…"
              />
            </label>

            <label className={styles.modalField}>
              <span>Who would you nominate?</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="optional — names, schools, anything that helps"
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
                {state.phase === "submitting" ? "Sending…" : "Send request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
