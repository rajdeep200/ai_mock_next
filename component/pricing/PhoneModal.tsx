"use client";

import { useEffect } from "react";
import { FiLoader } from "react-icons/fi";

type Props = {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
};

export default function PhoneModal({ value, onChange, error, saving, onSave, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <button className="scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <div className="modal-pos">
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="phone-title">
          <div className="ic">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
          </div>
          <h3 id="phone-title">Add your <b>phone number</b></h3>
          <p>We use your number for payment verification. Digits only (6–15).</p>
          <div className={`field${error ? " bad" : ""}`}>
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSave()}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g. 9876543210"
              autoComplete="tel"
              autoFocus
            />
            {error && <p className="err">{error}</p>}
          </div>
          <div className="actions">
            <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn" type="button" onClick={onSave} disabled={saving}>
              {saving ? <><FiLoader className="spin" /> Saving…</> : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
